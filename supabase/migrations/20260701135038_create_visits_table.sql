create table public.visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id),
  visit_date date not null,
  platform text not null check (platform in ('포포몬', '강남맛집', '캐시노트', '서울오빠', '디너의여왕', '리뷰노트', '레뷰')),
  store_name text not null,
  category text not null check (category in ('카페', '음식점', '기타')),
  sponsored_items text not null default '',
  retail_value numeric not null default 0,
  extra_payment numeric not null default 0,
  status text not null default '예정' check (status in ('예정', '완료')),
  post_url text,
  created_at timestamptz not null default now()
);

alter table public.visits enable row level security;

create policy "visits_select_own"
  on public.visits for select
  to authenticated
  using ( (select auth.uid()) = user_id );

create policy "visits_insert_own"
  on public.visits for insert
  to authenticated
  with check ( (select auth.uid()) = user_id );

create policy "visits_update_own"
  on public.visits for update
  to authenticated
  using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );

create policy "visits_delete_own"
  on public.visits for delete
  to authenticated
  using ( (select auth.uid()) = user_id );
