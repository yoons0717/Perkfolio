create table public.profiles (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  blog_url text not null,
  blog_name text,
  blog_description text,
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using ( (select auth.uid()) = user_id );

create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check ( (select auth.uid()) = user_id );

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );

create policy "profiles_delete_own"
  on public.profiles for delete
  to authenticated
  using ( (select auth.uid()) = user_id );
