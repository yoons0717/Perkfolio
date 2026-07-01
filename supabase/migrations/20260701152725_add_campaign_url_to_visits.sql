alter table public.visits
  add column campaign_url text not null default '';

alter table public.visits
  alter column campaign_url drop default;
