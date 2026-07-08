create table public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id),
  type text not null check (type in ('버그', '건의')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.feedback enable row level security;

create policy "feedback_insert_own"
  on public.feedback for insert
  to authenticated
  with check ( (select auth.uid()) = user_id );

create policy "feedback_select_admin"
  on public.feedback for select
  to authenticated
  using ( (select auth.jwt() ->> 'email') = 'yoons0717@gmail.com' );
