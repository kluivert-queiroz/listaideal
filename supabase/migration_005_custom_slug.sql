-- Migration: constrain share_token format to allow user-chosen slugs
-- Run this in the Supabase SQL editor on existing databases.
-- Existing tokens are all lowercase letters/digits already, so none violate this.

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'lists_share_token_format'
  ) then
    alter table public.lists
      add constraint lists_share_token_format
      check (share_token ~ '^[a-z0-9-]{3,30}$');
  end if;
end $$;
