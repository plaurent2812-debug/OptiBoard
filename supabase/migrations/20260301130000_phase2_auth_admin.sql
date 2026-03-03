-- Migration: Update for Phase 2 (Authentication & Admin)

-- Update Enums
-- We cannot easily 'ALTER TYPE ... ADD VALUE' in a transaction block with replacing safely in some Postgres versions,
-- so we'll just add SUPER_ADMIN if it doesn't exist.
ALTER TYPE user_role_type ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';

-- Update projects table adding title, budget, and renaming margin_estimate to margin
ALTER TABLE projects 
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS budget numeric(10, 2) default 0;

ALTER TABLE projects RENAME COLUMN margin_estimate TO margin;

-- Function to check if current user is SUPER_ADMIN
create or replace function is_super_admin()
returns boolean
language sql security definer set search_path = public
as $$
  select exists(
    select 1 from profiles 
    where id = auth.uid() and role::text = 'SUPER_ADMIN'
  );
$$;

-- UPDATE RLS POLICIES FOR SUPER ADMIN
-- (Drop existing policies if needed to redefine, or just add new OR conditions)

-- Organizations
create policy "Super Admins can view all organizations"
  on organizations for select
  using (is_super_admin());

create policy "Super Admins can update all organizations"
  on organizations for update
  using (is_super_admin());

-- Profiles
create policy "Super Admins can view all profiles"
  on profiles for select
  using (is_super_admin());

create policy "Super Admins can update all profiles"
  on profiles for update
  using (is_super_admin());

-- Clients
create policy "Super Admins can CRUD all clients"
  on clients for all
  using (is_super_admin());

-- Projects
create policy "Super Admins can CRUD all projects"
  on projects for all
  using (is_super_admin());

-- Documents
create policy "Super Admins can CRUD all documents"
  on documents for all
  using (is_super_admin());

-- Captures
create policy "Super Admins can CRUD all captures"
  on captures for all
  using (is_super_admin());
