-- Per-member interface language (D-26). memberships has no client write policies,
-- so this security-definer function is the only way a member changes their own locale.

create function public.set_my_locale(p_locale text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_locale is null or p_locale not in ('pt', 'en') then
    raise exception 'invalid_locale' using errcode = '22023';
  end if;

  update public.memberships
  set locale = p_locale
  where user_id = (select auth.uid());
end;
$$;

revoke execute on function public.set_my_locale(text) from public, anon;
grant execute on function public.set_my_locale(text) to authenticated;
