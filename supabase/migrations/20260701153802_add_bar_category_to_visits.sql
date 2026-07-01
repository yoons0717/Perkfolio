alter table public.visits
  drop constraint visits_category_check;

alter table public.visits
  add constraint visits_category_check
  check (category in ('카페', '음식점', '술집', '기타'));
