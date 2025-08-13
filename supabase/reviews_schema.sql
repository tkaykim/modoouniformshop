-- Reviews feature isolated schema (safe to run multiple times)

-- Optional (if not enabled already)
create extension if not exists pgcrypto;

-- Table
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  author uuid references auth.users(id) on delete set null,
  author_name text,
  rating int not null check (rating >= 0 and rating <= 5),
  title text not null,
  content text not null,
  images text[], -- public URLs (max 3 on write path)
  display_at timestamptz not null default now(),
  view_count int not null default 0
);

create index if not exists idx_reviews_display_at on public.reviews (display_at desc);

-- updated_at trigger
create or replace function public.tg_set_updated_at()
returns trigger as $$ begin new.updated_at = now(); return new; end; $$ language plpgsql;

drop trigger if exists trg_reviews_updated_at on public.reviews;
create trigger trg_reviews_updated_at before update on public.reviews
for each row execute function public.tg_set_updated_at();

-- RLS
alter table public.reviews enable row level security;

-- Policies (PostgreSQL does not support IF NOT EXISTS for POLICY)
drop policy if exists "reviews_select_anon" on public.reviews;
create policy "reviews_select_anon" on public.reviews for select to anon using (true);

drop policy if exists "reviews_select_auth" on public.reviews;
create policy "reviews_select_auth" on public.reviews for select to authenticated using (true);

drop policy if exists "reviews_insert_auth" on public.reviews;
create policy "reviews_insert_auth" on public.reviews for insert to authenticated with check (true);

drop policy if exists "reviews_update_auth" on public.reviews;
create policy "reviews_update_auth" on public.reviews for update to authenticated using (true);

-- Allow authenticated users to delete reviews (admin UI)
drop policy if exists "reviews_delete_auth" on public.reviews;
create policy "reviews_delete_auth" on public.reviews for delete to authenticated using (true);

-- Storage bucket for review images (public)
do $$ begin
  perform storage.create_bucket('reviews', public => true);
exception when others then null; end $$;

-- Storage policies (grant public read, auth upload for this bucket only)
drop policy if exists "reviews_images_public_read" on storage.objects;
create policy "reviews_images_public_read" on storage.objects
  for select to anon using (bucket_id = 'reviews');

drop policy if exists "reviews_images_auth_read" on storage.objects;
create policy "reviews_images_auth_read" on storage.objects
  for select to authenticated using (bucket_id = 'reviews');

drop policy if exists "reviews_images_auth_insert" on storage.objects;
create policy "reviews_images_auth_insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'reviews');

-- Optional: allow updating own uploads (authenticated)
drop policy if exists "reviews_images_auth_update" on storage.objects;
create policy "reviews_images_auth_update" on storage.objects
  for update to authenticated using (bucket_id = 'reviews') with check (bucket_id = 'reviews');

-- Verification helpers
-- List bucket
-- select id, name from storage.buckets where id = 'reviews';
-- List sample objects
-- select id, name, bucket_id from storage.objects where bucket_id = 'reviews' limit 10;

-- RPC: increment view count (bypass RLS safely)
create or replace function public.increment_review_view(review_id uuid)
returns int
language sql
security definer
set search_path = public
as $$
  update public.reviews
  set view_count = coalesce(view_count, 0) + 1
  where id = review_id
  returning view_count;
$$;

revoke all on function public.increment_review_view(uuid) from public;
grant execute on function public.increment_review_view(uuid) to anon, authenticated;

-- Helper: return current user info (email from auth.users, name/role from profiles)
create or replace function public.get_me()
returns table (id uuid, email text, display_name text, role text)
language sql
security definer
set search_path = public
as $$
  select u.id, u.email, p.display_name, p.role::text
  from auth.users u
  join public.profiles p on p.id = u.id
  where u.id = auth.uid();
$$;

revoke all on function public.get_me() from public;
grant execute on function public.get_me() to authenticated;

-- Admin-only: list all users with profiles (returns empty if caller is not admin)
create or replace function public.list_users_admin()
returns table (id uuid, email text, display_name text, role text)
language sql
security definer
set search_path = public
as $$
  select u.id, u.email, p.display_name, p.role::text
  from auth.users u
  join public.profiles p on p.id = u.id
  where exists (
    select 1 from public.profiles me where me.id = auth.uid() and me.role::text = 'admin'
  );
$$;

revoke all on function public.list_users_admin() from public;
grant execute on function public.list_users_admin() to authenticated;

