-- Photos are read only through the application: the photo route checks membership and the
-- photo row with the member's own session, then fetches the file with the service role.
-- Dropping the direct SELECT policy means a removed member (or anyone holding a stale session)
-- has no path to the files: a direct Storage read by a member that had just downloaded a
-- file stayed allowed for several seconds after removal in testing (D-24, Phase 1 D-09).
-- Members keep INSERT (upload at save) and DELETE (remove a photo).

drop policy if exists recipe_photos_objects_select on storage.objects;
