-- Migration: switch share_token default to 5-char slug
-- Run this in the Supabase SQL editor on existing databases.
-- Existing tokens are kept as-is (no guest links are broken).

create or replace function public.gen_slug()
returns text
language plpgsql
as $$
declare
  chars text := 'abcdefghjkmnpqrstuvwxyz23456789';
  slug  text;
  taken boolean;
begin
  loop
    slug := '';
    for i in 1..5 loop
      slug := slug || substr(chars, (floor(random() * length(chars)) + 1)::int, 1);
    end loop;
    select exists (select 1 from public.lists where share_token = slug) into taken;
    exit when not taken;
  end loop;
  return slug;
end;
$$;

alter table public.lists
  alter column share_token set default gen_slug();
