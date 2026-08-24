-- Migration: RSVP feature — guests confirm attendance + headcount
-- Run this in the Supabase SQL editor on existing databases.

create table if not exists public.rsvps (
  id           uuid        primary key default gen_random_uuid(),
  list_id      uuid        not null references public.lists(id) on delete cascade,
  guest_name   text        not null check (char_length(btrim(guest_name)) > 0),
  is_attending boolean     not null,
  guest_count  integer     not null default 1,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  check (guest_count between 0 and 20),
  check ((is_attending and guest_count >= 1) or (not is_attending and guest_count = 0))
);

create unique index if not exists rsvps_list_guest_idx on public.rsvps(list_id, lower(guest_name));
create index if not exists rsvps_list_id_idx on public.rsvps(list_id, created_at desc);

alter table public.rsvps enable row level security;

-- Owner-only, no anon policy — same shape as owners_manage_list_messages. The
-- public guest page/action goes through the service-role client instead, via
-- the upsert_rsvp() function below.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'rsvps' and policyname = 'owners_manage_rsvps'
  ) then
    create policy "owners_manage_rsvps" on public.rsvps
      for all
      using (
        exists (
          select 1 from public.lists
          where lists.id = rsvps.list_id
            and lists.owner_id = auth.uid()
        )
      );
  end if;
end $$;

-- Atomic upsert-by-name, mirrors claim_gift_slot's pattern for anonymous
-- concurrent guest writes with a business invariant (one row per guest name,
-- case-insensitive, per list).
create or replace function public.upsert_rsvp(
  p_list_id      uuid,
  p_guest_name   text,
  p_is_attending boolean,
  p_guest_count  integer
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.rsvps;
begin
  insert into public.rsvps (list_id, guest_name, is_attending, guest_count)
  values (p_list_id, p_guest_name, p_is_attending, p_guest_count)
  on conflict (list_id, (lower(guest_name)))
  do update set is_attending = excluded.is_attending,
                guest_count  = excluded.guest_count,
                updated_at   = now()
  returning * into v_row;

  return jsonb_build_object(
    'guest_name', v_row.guest_name,
    'is_attending', v_row.is_attending,
    'guest_count', v_row.guest_count
  );
end;
$$;
