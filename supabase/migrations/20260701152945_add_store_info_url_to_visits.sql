alter table public.visits
  add column store_info_url text not null default '';

alter table public.visits
  alter column store_info_url drop default;
