alter table public.visits
  add column post_urls text[] not null default '{}';

update public.visits
  set post_urls = array[post_url]
  where post_url is not null;

alter table public.visits
  drop column post_url;
