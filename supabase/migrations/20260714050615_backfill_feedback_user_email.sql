update public.feedback f
set user_email = u.email
from auth.users u
where f.user_id = u.id
  and f.user_email is null;
