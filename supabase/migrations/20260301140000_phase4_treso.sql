-- Add organization_id to documents to allow standalone receipts/expenses
ALTER TABLE documents 
  ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;

-- Backfill organization_id from projects
UPDATE documents SET organization_id = projects.organization_id
FROM projects
WHERE documents.project_id = projects.id;

-- Now make organization_id NOT NULL and project_id NULLABLE
ALTER TABLE documents ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE documents ALTER COLUMN project_id DROP NOT NULL;

-- Update RLS policies for documents
DROP POLICY IF EXISTS "Users can CRUD documents for their organization's projects" ON documents;
DROP POLICY IF EXISTS "Super Admins can CRUD all documents" ON documents;

CREATE POLICY "Users can CRUD documents in their organization"
  ON documents FOR ALL
  USING (organization_id = get_current_org_id());

CREATE POLICY "Super Admins can CRUD all documents"
  ON documents FOR ALL
  USING (is_super_admin());
