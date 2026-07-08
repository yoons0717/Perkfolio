alter table public.dashboard_graphs
  drop constraint dashboard_graphs_scope_check;

alter table public.dashboard_graphs
  add constraint dashboard_graphs_scope_check
  check (scope in ('all', 'thisMonth', 'lastMonth', 'thisYear', 'lastYear'));
