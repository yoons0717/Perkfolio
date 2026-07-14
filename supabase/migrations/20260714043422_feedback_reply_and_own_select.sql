alter table public.feedback
  add column user_email text,
  add column admin_reply text,
  add column replied_at timestamptz;

create policy "feedback_select_own"
  on public.feedback for select
  to authenticated
  using ( (select auth.uid()) = user_id );

create policy "feedback_update_admin"
  on public.feedback for update
  to authenticated
  using ( (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' )
  with check ( (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' );
