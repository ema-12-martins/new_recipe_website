-- Member removal (AUTH-02, D-10, D-21). The owner reviews the recipes a member originally
-- created and removes the ones marked remove; the server then deletes the member's auth
-- account, which cascades their membership and nulls recipe_creators.created_by and
-- invites.used_by for everything kept (D-17), freeing the email for a later re-invite (D-31).

-- Deletes only recipes in p_recipe_ids that p_member originally created; any other id is
-- ignored. Owner only, never on the owner themself, and only while p_member is a member.
create function public.delete_member_recipes(p_member uuid, p_recipe_ids uuid[])
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deleted integer;
begin
  if not public.is_owner() then
    raise exception 'not_owner' using errcode = '42501';
  end if;

  if p_member = (select auth.uid()) then
    raise exception 'cannot_remove_self' using errcode = 'P0001';
  end if;

  if not exists (
    select 1 from public.memberships m
    where m.user_id = p_member
      and m.role = 'member'
      and m.cookbook_id = public.current_cookbook_id()
  ) then
    raise exception 'not_a_member' using errcode = 'P0001';
  end if;

  delete from public.recipes r
  using public.recipe_creators c
  where c.recipe_id = r.id
    and c.created_by = p_member
    and r.id = any (coalesce(p_recipe_ids, '{}'))
    and r.cookbook_id = public.current_cookbook_id();

  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

revoke execute on function public.delete_member_recipes(uuid, uuid[]) from public, anon;
grant execute on function public.delete_member_recipes(uuid, uuid[]) to authenticated;
