-- A saved recipe needs a title (already checked on recipes.title), at least one ingredient line
-- and at least one step with visible text. The application enforces the same rule; this is the
-- backstop for direct API writes.
--
-- Existing incomplete recipes must be removed first with scripts/remove-incomplete-recipes.mjs
-- (it also deletes their photo files from Storage, which SQL cannot do); otherwise adding the
-- constraints below fails.

-- True when at least one element contains a non-whitespace character.
create function public.has_text_line(arr text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(bool_or(x ~ '[^[:space:]]'), false)
  from unnest(arr) as x;
$$;

alter table public.recipes
  add constraint recipes_has_ingredient check (public.has_text_line(ingredients)),
  add constraint recipes_has_step check (public.has_text_line(steps));
