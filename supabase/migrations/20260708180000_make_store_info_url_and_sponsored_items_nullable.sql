alter table public.visits
  alter column store_info_url drop not null,
  alter column sponsored_items drop not null;
