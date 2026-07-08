create table public.dashboard_graphs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id),
  axis text not null check (axis in ('category', 'platform', 'month')),
  chart_type text not null check (chart_type in ('bar', 'line')),
  scope text not null check (scope in ('all', 'period')),
  created_at timestamptz not null default now()
);

alter table public.dashboard_graphs enable row level security;

create policy "dashboard_graphs_select_own"
  on public.dashboard_graphs for select
  to authenticated
  using ( (select auth.uid()) = user_id );

create policy "dashboard_graphs_insert_own"
  on public.dashboard_graphs for insert
  to authenticated
  with check ( (select auth.uid()) = user_id );

create policy "dashboard_graphs_delete_own"
  on public.dashboard_graphs for delete
  to authenticated
  using ( (select auth.uid()) = user_id );
