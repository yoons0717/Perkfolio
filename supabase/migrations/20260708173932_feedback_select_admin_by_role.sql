drop policy "feedback_select_admin" on public.feedback;

create policy "feedback_select_admin"
  on public.feedback for select
  to authenticated
  using ( (select auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' );
