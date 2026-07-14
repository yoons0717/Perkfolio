drop policy "feedback_insert_own" on public.feedback;

create policy "feedback_insert_own"
  on public.feedback for insert
  to authenticated
  with check (
    (select auth.uid()) = user_id
    and (user_email is null or user_email = (select auth.jwt() ->> 'email'))
  );
