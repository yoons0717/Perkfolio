alter table public.visits
  drop constraint visits_status_check;

update public.visits set status = '리뷰완료' where status = '완료';

alter table public.visits
  add constraint visits_status_check
  check (status in ('예정', '방문완료', '리뷰완료'));

alter table public.visits
  alter column status set default '예정';
