-- Insert Organizations
INSERT INTO public.organizations (id, name, subscription_plan)
VALUES 
    ('d7a9b0e1-0000-0000-0000-000000000001', 'Artisan 1 Plomberie', 'Expert'),
    ('d7a9b0e1-0000-0000-0000-000000000002', 'Menuiserie Dubois', 'Bras Droit');

-- Insert Auth Users (Password for both is "password123")
INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, recovery_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token
) VALUES
('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'jean@artisan.fr', crypt('password123', gen_salt('bf')), current_timestamp, current_timestamp, current_timestamp, '{"provider":"email","providers":["email"]}', '{}', current_timestamp, current_timestamp, '', '', '', ''),
('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'admin@optipro.fr', crypt('password123', gen_salt('bf')), current_timestamp, current_timestamp, current_timestamp, '{"provider":"email","providers":["email"]}', '{}', current_timestamp, current_timestamp, '', '', '', '');

-- Insert Identities
INSERT INTO auth.identities (
    id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) VALUES
('11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', format('{"sub":"%s","email":"%s"}', '11111111-1111-1111-1111-111111111111', 'jean@artisan.fr')::jsonb, 'email', current_timestamp, current_timestamp, current_timestamp),
('22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', format('{"sub":"%s","email":"%s"}', '22222222-2222-2222-2222-222222222222', 'admin@optipro.fr')::jsonb, 'email', current_timestamp, current_timestamp, current_timestamp);


-- Insert Profiles
INSERT INTO public.profiles (id, organization_id, role)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'd7a9b0e1-0000-0000-0000-000000000001', 'ARTISAN'),
    ('22222222-2222-2222-2222-222222222222', 'd7a9b0e1-0000-0000-0000-000000000001', 'SUPER_ADMIN');

-- Insert Clients
INSERT INTO public.clients (id, organization_id, name, email, phone)
VALUES 
    ('b1111111-1111-1111-1111-111111111111', 'd7a9b0e1-0000-0000-0000-000000000001', 'M. Dupont', 'dupont@mail.com', '0601020304'),
    ('b2222222-2222-2222-2222-222222222222', 'd7a9b0e1-0000-0000-0000-000000000001', 'Mme. Leroy', 'leroy@mail.com', '0605060708');

-- Insert Projects
INSERT INTO public.projects (id, organization_id, client_id, status, title, budget, margin)
VALUES 
    ('e1111111-1111-1111-1111-111111111111', 'd7a9b0e1-0000-0000-0000-000000000001', 'b1111111-1111-1111-1111-111111111111', 'EN_COURS', 'Rénovation Salle de Bain', 5000.00, 1500.00),
    ('e2222222-2222-2222-2222-222222222222', 'd7a9b0e1-0000-0000-0000-000000000001', 'b2222222-2222-2222-2222-222222222222', 'DEVIS', 'Cuisine sur mesure', 12000.00, 3500.00);

-- Insert Storage Buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES ('captures', 'captures', true, 52428800, '{image/*,audio/*,application/pdf}') 
ON CONFLICT (id) DO UPDATE SET 
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage policies
CREATE POLICY "Public Capture Storage View"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'captures' );

CREATE POLICY "Authenticated Users Can Upload Captures"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK ( bucket_id = 'captures' );

CREATE POLICY "Users can update their own captures"
  ON storage.objects FOR UPDATE TO authenticated
  WITH CHECK ( bucket_id = 'captures' AND auth.uid() = owner);

CREATE POLICY "Users can delete their own captures"
  ON storage.objects FOR DELETE TO authenticated
  USING ( bucket_id = 'captures' AND auth.uid() = owner);
