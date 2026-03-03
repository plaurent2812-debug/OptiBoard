-- Phase 2: DB Schema Adjustments
-- Add a dedicated summary column for voice memos (replacing URL hashtag hack)
ALTER TABLE captures ADD COLUMN IF NOT EXISTS summary text;

-- Create an optimized view for the dashboard stats
-- Using security_invoker = true so it respects the documents table RLS!
CREATE OR REPLACE VIEW organization_stats WITH (security_invoker = true) AS
SELECT 
    organization_id,
    COALESCE(SUM(amount_ht) FILTER (WHERE type = 'FACTURE' AND status = 'PAYEE'), 0) AS total_chiffre_affaire_encaisse_HT,
    COALESCE(SUM(amount_ht) FILTER (WHERE type = 'ACHAT'), 0) AS total_achats_materiel_HT
FROM documents
GROUP BY organization_id;

-- Grant access to authenticated users
GRANT SELECT ON organization_stats TO authenticated;
