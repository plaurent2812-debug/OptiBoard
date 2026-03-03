-- ============================================================
-- Phase 10: Pro-Level Schema Upgrade
-- Transforms OptiBoard from MVP to professional SaaS
-- ============================================================

-- ============================================================
-- 1. ORGANIZATION SETTINGS (Legal identity, branding, billing)
-- ============================================================
CREATE TABLE IF NOT EXISTS organization_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
    -- Legal
    siret text,
    tva_number text,
    legal_form text, -- "Auto-entrepreneur", "SARL", "SAS", etc.
    -- Contact
    address text,
    city text,
    postal_code text,
    phone text,
    email text,
    website text,
    -- Branding
    logo_url text,
    -- Banking
    bank_iban text,
    bank_bic text,
    -- Preferences
    default_tva_rate numeric(5,2) DEFAULT 20.00,
    quote_prefix text DEFAULT 'D',
    invoice_prefix text DEFAULT 'F',
    quote_validity_days integer DEFAULT 30,
    payment_terms_days integer DEFAULT 30,
    monthly_revenue_target numeric(12,2) DEFAULT 0,
    -- Timestamps
    created_at timestamptz DEFAULT now() NOT NULL,
    updated_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their org settings"
    ON organization_settings FOR SELECT
    USING (organization_id = get_current_org_id());

CREATE POLICY "Users can update their org settings"
    ON organization_settings FOR UPDATE
    USING (organization_id = get_current_org_id());

CREATE POLICY "Users can insert their org settings"
    ON organization_settings FOR INSERT
    WITH CHECK (organization_id = get_current_org_id());

CREATE POLICY "Super Admins can manage all org settings"
    ON organization_settings FOR ALL
    USING (is_super_admin());

-- ============================================================
-- 2. DOCUMENT ITEMS (Proper relational storage for quote/invoice line items)
-- ============================================================
CREATE TABLE IF NOT EXISTS document_items (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id uuid NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    description text NOT NULL,
    quantity numeric(10,2) NOT NULL DEFAULT 1,
    unit text DEFAULT 'u', -- 'u', 'm²', 'ml', 'h', 'forfait'
    unit_price_ht numeric(12,2) NOT NULL DEFAULT 0,
    tva_rate numeric(5,2) DEFAULT 20.00,
    sort_order integer DEFAULT 0,
    created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE document_items ENABLE ROW LEVEL SECURITY;

-- Document items inherit access from documents via organization_id
CREATE POLICY "Users can manage document items in their org"
    ON document_items FOR ALL
    USING (
        document_id IN (
            SELECT id FROM documents WHERE organization_id = get_current_org_id()
        )
    );

CREATE POLICY "Super Admins can manage all document items"
    ON document_items FOR ALL
    USING (is_super_admin());

-- ============================================================
-- 3. ACTIVITIES (Activity feed for dashboard & project history)
-- ============================================================
CREATE TABLE IF NOT EXISTS activities (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    entity_type text NOT NULL, -- 'project', 'document', 'client', 'invoice'
    entity_id uuid,
    action text NOT NULL, -- 'created', 'accepted', 'paid', 'declined', 'archived'
    actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamptz DEFAULT now() NOT NULL
);

ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activities in their org"
    ON activities FOR SELECT
    USING (organization_id = get_current_org_id());

CREATE POLICY "Users can insert activities in their org"
    ON activities FOR INSERT
    WITH CHECK (organization_id = get_current_org_id());

CREATE POLICY "Super Admins can manage all activities"
    ON activities FOR ALL
    USING (is_super_admin());

-- ============================================================
-- 4. ENRICH EXISTING TABLES
-- ============================================================

-- Documents: add reference number, supplier, TVA, TTC, notes
ALTER TABLE documents
    ADD COLUMN IF NOT EXISTS reference_number text,
    ADD COLUMN IF NOT EXISTS supplier_name text,
    ADD COLUMN IF NOT EXISTS notes text,
    ADD COLUMN IF NOT EXISTS tva_rate numeric(5,2) DEFAULT 20.00,
    ADD COLUMN IF NOT EXISTS amount_ttc numeric(12,2) DEFAULT 0,
    ADD COLUMN IF NOT EXISTS due_date date,
    ADD COLUMN IF NOT EXISTS paid_at timestamptz,
    ADD COLUMN IF NOT EXISTS payment_method text;

-- Projects: add scheduling, address, priority, notes
ALTER TABLE projects
    ADD COLUMN IF NOT EXISTS start_date date,
    ADD COLUMN IF NOT EXISTS end_date date,
    ADD COLUMN IF NOT EXISTS address text,
    ADD COLUMN IF NOT EXISTS notes text,
    ADD COLUMN IF NOT EXISTS priority text DEFAULT 'NORMAL'; -- 'URGENT', 'NORMAL', 'LOW'

-- Clients: add company details, notes, tags
ALTER TABLE clients
    ADD COLUMN IF NOT EXISTS company_name text,
    ADD COLUMN IF NOT EXISTS siret text,
    ADD COLUMN IF NOT EXISTS notes text,
    ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Profiles: add name, avatar, phone
ALTER TABLE profiles
    ADD COLUMN IF NOT EXISTS first_name text,
    ADD COLUMN IF NOT EXISTS last_name text,
    ADD COLUMN IF NOT EXISTS avatar_url text,
    ADD COLUMN IF NOT EXISTS phone text;

-- ============================================================
-- 5. SEQUENCES FOR DOCUMENT NUMBERING
-- ============================================================
-- We use a function-based approach for org-scoped sequential numbering

CREATE OR REPLACE FUNCTION generate_document_number(
    p_org_id uuid,
    p_type text -- 'DEVIS' or 'FACTURE'
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_prefix text;
    v_year text;
    v_count integer;
BEGIN
    -- Get prefix from org settings
    IF p_type = 'DEVIS' THEN
        SELECT COALESCE(quote_prefix, 'D') INTO v_prefix
        FROM organization_settings WHERE organization_id = p_org_id;
    ELSE
        SELECT COALESCE(invoice_prefix, 'F') INTO v_prefix
        FROM organization_settings WHERE organization_id = p_org_id;
    END IF;

    -- Fallback if no settings exist yet
    IF v_prefix IS NULL THEN
        v_prefix := CASE WHEN p_type = 'DEVIS' THEN 'D' ELSE 'F' END;
    END IF;

    v_year := EXTRACT(YEAR FROM CURRENT_DATE)::text;

    -- Count existing documents of this type for this org this year
    SELECT COUNT(*) + 1 INTO v_count
    FROM documents
    WHERE organization_id = p_org_id
      AND type = p_type::document_type
      AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE);

    RETURN v_prefix || '-' || v_year || '-' || LPAD(v_count::text, 3, '0');
END;
$$;

-- ============================================================
-- 6. AUTO-CREATE ORG SETTINGS ON NEW ORGANIZATION
-- ============================================================
CREATE OR REPLACE FUNCTION auto_create_org_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO organization_settings (organization_id)
    VALUES (NEW.id)
    ON CONFLICT (organization_id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS create_org_settings_trigger ON organizations;
CREATE TRIGGER create_org_settings_trigger
    AFTER INSERT ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_org_settings();

-- ============================================================
-- 7. AUTO-CREATE PROFILE ON NEW USER SIGNUP
-- ============================================================
-- This function handles the signup flow:
-- When a new user signs up, if they provide org info in metadata,
-- create the org + profile automatically.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_org_id uuid;
    v_org_name text;
    v_first_name text;
    v_last_name text;
BEGIN
    -- Extract metadata from the signup
    v_org_name := NEW.raw_user_meta_data->>'company_name';
    v_first_name := NEW.raw_user_meta_data->>'first_name';
    v_last_name := NEW.raw_user_meta_data->>'last_name';

    -- Create organization if company name was provided
    IF v_org_name IS NOT NULL AND v_org_name != '' THEN
        INSERT INTO organizations (name)
        VALUES (v_org_name)
        RETURNING id INTO v_org_id;
    END IF;

    -- Create profile
    INSERT INTO profiles (id, organization_id, role, first_name, last_name)
    VALUES (
        NEW.id,
        v_org_id,
        'ARTISAN',
        COALESCE(v_first_name, ''),
        COALESCE(v_last_name, '')
    );

    RETURN NEW;
END;
$$;

-- Only create the trigger if it doesn't already exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 8. UPDATED TIMESTAMP TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER update_org_settings_updated_at
    BEFORE UPDATE ON organization_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();
