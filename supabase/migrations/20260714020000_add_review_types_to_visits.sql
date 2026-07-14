alter table public.visits
  add column review_types text[] not null default '{}';

alter table public.visits
  add constraint visits_review_types_check
  check (review_types <@ array['블로그', '클립', '유튜브', '인스타 게시물', '릴스']);
