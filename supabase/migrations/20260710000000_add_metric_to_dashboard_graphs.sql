alter table public.dashboard_graphs
  add column metric text not null default 'avgNet'
  check (metric in ('avgNet', 'totalNet', 'count'));
