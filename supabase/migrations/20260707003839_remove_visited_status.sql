alter table public.visits
  drop constraint visits_status_check;

update public.visits set status = '예정' where status = '방문완료';

alter table public.visits
  add constraint visits_status_check
  check (status in ('예정', '리뷰완료'));
