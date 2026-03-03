-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create Enums
create type subscription_plan_type as enum ('Sérénité', 'Bras Droit', 'Expert');
create type user_role_type as enum ('ARTISAN', 'ADMIN_OPTIPRO');
create type project_status_type as enum ('DEVIS', 'EN_COURS', 'TERMINE', 'ARCHIVE');
create type document_type as enum ('DEVIS', 'FACTURE', 'ACHAT');
create type capture_type as enum ('IMAGE', 'AUDIO');

-- Create organizations table
create table organizations (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    subscription_plan subscription_plan_type not null default 'Sérénité',
    settings jsonb not null default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create profiles table
create table profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    organization_id uuid references organizations(id) on delete cascade,
    role user_role_type not null default 'ARTISAN',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create clients table
create table clients (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references organizations(id) on delete cascade,
    name text not null,
    email text,
    phone text,
    address text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create projects table
create table projects (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references organizations(id) on delete cascade,
    client_id uuid references clients(id) on delete set null,
    status project_status_type not null default 'DEVIS',
    total_ht numeric(10, 2) default 0,
    margin_estimate numeric(10, 2) default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create documents table
create table documents (
    id uuid primary key default gen_random_uuid(),
    project_id uuid not null references projects(id) on delete cascade,
    type document_type not null,
    url text not null,
    status text,
    amount_ht numeric(10, 2) default 0,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create captures table
create table captures (
    id uuid primary key default gen_random_uuid(),
    organization_id uuid not null references organizations(id) on delete cascade,
    type capture_type not null,
    storage_url text not null,
    processed boolean not null default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- SET UP ROW LEVEL SECURITY (RLS)

-- Enable RLS on all tables
alter table organizations enable row level security;
alter table profiles enable row level security;
alter table clients enable row level security;
alter table projects enable row level security;
alter table documents enable row level security;
alter table captures enable row level security;

-- Function to get current user's organization_id safely
create or replace function get_current_org_id()
returns uuid
language sql security definer set search_path = public
as $$
  select organization_id from profiles where id = auth.uid();
$$;

-- RLS Policies for organizations
create policy "Users can view their own organization"
  on organizations for select
  using (id = get_current_org_id());

-- RLS Policies for profiles
create policy "Users can view profiles in their organization"
  on profiles for select
  using (organization_id = get_current_org_id());

create policy "Users can update their own profile"
  on profiles for update
  using (id = auth.uid());

-- RLS Policies for clients
create policy "Users can CRUD clients in their organization"
  on clients for all
  using (organization_id = get_current_org_id());

-- RLS Policies for projects
create policy "Users can CRUD projects in their organization"
  on projects for all
  using (organization_id = get_current_org_id());

-- RLS Policies for documents
-- Documents belongs to projects, which belongs to organizations.
create policy "Users can CRUD documents for their organization's projects"
  on documents for all
  using (
    project_id in (
      select id from projects where organization_id = get_current_org_id()
    )
  );

-- RLS Policies for captures
create policy "Users can CRUD captures in their organization"
  on captures for all
  using (organization_id = get_current_org_id());
