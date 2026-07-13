alter table public.visits
  drop constraint visits_user_id_fkey,
  add constraint visits_user_id_fkey
    foreign key (user_id) references auth.users (id) on delete cascade;

alter table public.feedback
  drop constraint feedback_user_id_fkey,
  add constraint feedback_user_id_fkey
    foreign key (user_id) references auth.users (id) on delete cascade;

alter table public.dashboard_graphs
  drop constraint dashboard_graphs_user_id_fkey,
  add constraint dashboard_graphs_user_id_fkey
    foreign key (user_id) references auth.users (id) on delete cascade;
