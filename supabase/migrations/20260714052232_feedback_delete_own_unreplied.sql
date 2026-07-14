create policy "feedback_delete_own_unreplied"
  on public.feedback for delete
  to authenticated
  using ( (select auth.uid()) = user_id and admin_reply is null );
