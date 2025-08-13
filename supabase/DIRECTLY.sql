-- One-off additive SQL to enable manual inquiry creation and source classification
-- Safe to run multiple times

-- 1) Optional enum for inquiry source (kept separate from any existing text column)
do $$ begin
  if not exists (select 1 from pg_type where typname = 'inquiry_source') then
    create type inquiry_source as enum (
      '네이버 스마트스토어',
      '카카오톡채널',
      '카카오샵',
      '외부영업',
      '지인'
    );
  end if;
end $$;

-- 2) Add enum-based column if not exists (keeps existing source_channel text column intact)
alter table if exists public.inquiries
  add column if not exists source inquiry_source;

-- 3) Backfill enum column from existing text column when values match the options
update public.inquiries
set source = source_channel::inquiry_source
where source is null and source_channel in ('네이버 스마트스토어','카카오톡채널','카카오샵','외부영업','지인')
;

-- 4) RLS: allow authenticated users to insert (for admin/agent UI)
-- (Skip if already present in base schema)
alter table public.inquiries enable row level security;
do $$ begin
  perform 1 from pg_policies where schemaname = 'public' and tablename = 'inquiries' and policyname = 'inquiries_insert_auth';
  if not found then
    create policy "inquiries_insert_auth" on public.inquiries for insert to authenticated with check (true);
  end if;
end $$;

