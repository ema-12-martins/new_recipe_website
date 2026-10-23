-- Editing a recipe's photos (RECP-02, D-21, D-22): members can renumber a recipe's photos.
-- Positions are unique per recipe but the check is deferred, so renumbering must happen in one
-- statement; set_recipe_photo_order does that and runs with the caller's rights (RLS applies).

grant update (position) on public.recipe_photos to authenticated;

create policy recipe_photos_update_members
  on public.recipe_photos
  for update
  to authenticated
  using (public.is_member() and cookbook_id = public.current_cookbook_id())
  with check (public.is_member() and cookbook_id = public.current_cookbook_id());

create function public.set_recipe_photo_order(p_recipe_id uuid, p_photo_ids uuid[])
returns void
language sql
security invoker
set search_path = ''
as $$
  update public.recipe_photos p
  set position = o.ord::smallint
  from unnest(p_photo_ids) with ordinality as o(id, ord)
  where p.id = o.id and p.recipe_id = p_recipe_id;
$$;

revoke execute on function public.set_recipe_photo_order(uuid, uuid[]) from public, anon;
grant execute on function public.set_recipe_photo_order(uuid, uuid[]) to authenticated, service_role;
