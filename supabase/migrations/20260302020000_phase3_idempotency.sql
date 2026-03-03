-- Phase 3: Idempotency and Race Condition Prevention

-- Create expression index for case-insensitive unique client names per organization
CREATE UNIQUE INDEX IF NOT EXISTS unique_org_client_name_idx ON clients (organization_id, lower(name));

-- Prevent processing the same receipt URL twice
ALTER TABLE documents ADD CONSTRAINT unique_org_doc_url UNIQUE (organization_id, url);

-- Prevent duplicate project titles for the same client
CREATE UNIQUE INDEX IF NOT EXISTS unique_client_project_title_idx ON projects (client_id, lower(title));
