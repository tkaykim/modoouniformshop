-- Supabase Schema for MODOO Uniform Shop Chatbot

-- Extensions
create extension if not exists pgcrypto;

-- Enums
create type inquiry_status as enum ('new','in_progress','awaiting_reply','completed','archived');
create type design_stage as enum ('complete','assets_only','need_help');
create type inquiry_type as enum ('단체복','커스텀 소량 굿즈');

-- Profiles (admin/agent)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'agent',
  display_name text,
  created_at timestamptz default now()
);

-- Inquiries
create table if not exists inquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  -- Session / tracking
  session_id uuid not null,
  utm jsonb,
  source_channel text,

  -- Answers
  inquiry_kind inquiry_type,
  priorities jsonb,
  items text[],
  item_custom text,
  quantity integer,
  design design_stage,
  needed_date date,
  heard_about text,
  name text,
  contact text,
  privacy_consent boolean default false,
  privacy_consent_at timestamptz,
  preferred_time_start time,
  preferred_time_end time,

  -- Ops
  last_step_completed int default 0,
  status inquiry_status default 'new',
  assignee uuid references profiles(id),
  admin_notes text
);

create index if not exists idx_inquiries_created_at on inquiries (created_at desc);
create index if not exists idx_inquiries_status on inquiries (status);
create index if not exists idx_inquiries_assignee on inquiries (assignee);

-- Inquiry Events
create table if not exists inquiry_events (
  id bigserial primary key,
  inquiry_id uuid references inquiries(id) on delete cascade,
  created_at timestamptz default now(),
  actor uuid references profiles(id),
  type text not null,
  payload jsonb
);

-- Reviews
create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  author uuid references profiles(id),
  rating int check (rating >= 0 and rating <= 5) not null,
  title text not null,
  content text not null,
  images text[], -- public URLs (max 3 on write path)
  display_at timestamptz default now() -- date/time shown in UI
);

alter table reviews enable row level security;

-- Public can read reviews
create policy if not exists public_read_reviews on reviews for select to anon using (true);
create policy if not exists auth_read_reviews on reviews for select to authenticated using (true);

-- Only authenticated (admin) can insert/update
create policy if not exists auth_insert_reviews on reviews for insert to authenticated with check (true);
create policy if not exists auth_update_reviews on reviews for update to authenticated using (true);

-- Storage bucket for review images (public)
-- This requires the storage extension; ignore if already exists
do $$ begin
  perform storage.create_bucket('reviews', public => true);
exception when others then null; end $$;

-- RLS
alter table profiles enable row level security;
alter table inquiries enable row level security;
alter table inquiry_events enable row level security;

-- Policies: allow authenticated users (admin/agent) to read/update
drop policy if exists admin_read_profiles on profiles;
create policy admin_read_profiles on profiles for select to authenticated using (true);

drop policy if exists admin_read_inquiries on inquiries;
create policy admin_read_inquiries on inquiries for select to authenticated using (true);

drop policy if exists admin_update_inquiries on inquiries;
create policy admin_update_inquiries on inquiries for update to authenticated using (true);

-- Allow admin users to delete inquiries
drop policy if exists admin_delete_inquiries on inquiries;
create policy admin_delete_inquiries on inquiries
  for delete to authenticated
  using (exists (
    select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'
  ));

drop policy if exists admin_read_events on inquiry_events;
create policy admin_read_events on inquiry_events for select to authenticated using (true);

drop policy if exists admin_insert_events on inquiry_events;
create policy admin_insert_events on inquiry_events for insert to authenticated with check (true);

-- NOTE: No insert/update policy on inquiries for anon users.
-- Public writes are performed only through Edge Functions with service role.

-- Set database timezone to KST (Asia/Seoul) so all timestamptz display in KST by default
-- Supabase disallows altering the whole database timezone; set per-role instead
alter role anon set time zone 'Asia/Seoul';
alter role authenticated set time zone 'Asia/Seoul';
alter role service_role set time zone 'Asia/Seoul';

-- =============================
-- TEMP: Disable all RLS policies (to be replaced by Next.js API security)
-- Drop policies to avoid recursion and allow unrestricted access while prototyping
-- =============================

-- Profiles
drop policy if exists admin_read_profiles on profiles;
-- Inquiries
drop policy if exists admin_read_inquiries on inquiries;
drop policy if exists admin_update_inquiries on inquiries;
drop policy if exists admin_delete_inquiries on inquiries;
-- Inquiry Events
drop policy if exists admin_read_events on inquiry_events;
drop policy if exists admin_insert_events on inquiry_events;
-- Reviews
drop policy if exists public_read_reviews on reviews;
drop policy if exists auth_read_reviews on reviews;
drop policy if exists auth_insert_reviews on reviews;
drop policy if exists auth_update_reviews on reviews;

-- Finally disable RLS entirely on these tables
alter table profiles disable row level security;
alter table inquiries disable row level security;
alter table inquiry_events disable row level security;
alter table reviews disable row level security;

