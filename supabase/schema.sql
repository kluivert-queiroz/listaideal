-- ListaIdeal database schema
-- Run this in the Supabase SQL editor to initialize the database.

-- ── Slug generator ───────────────────────────────────────────────────────────
-- Generates a 5-char alphanumeric slug, retrying on the rare collision.
-- Charset omits visually ambiguous characters (0/o, 1/l/i).

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

-- ── Tables ──────────────────────────────────────────────────────────────────

-- One row per auth user, holding the username used for login. Kept separate
-- from auth.users (which Supabase Auth owns) rather than folded into user
-- metadata, so it can carry its own RLS policy and a case-insensitive unique
-- index. The email lives only in auth.users — this table never duplicates it,
-- so there is nothing here to drift when a user changes their email.
create table if not exists public.profiles (
  id         uuid        primary key references auth.users(id) on delete cascade,
  username   text        not null check (username ~ '^[a-zA-Z0-9_.]{3,20}$'),
  created_at timestamptz not null default now()
);

create unique index if not exists profiles_username_idx on public.profiles(lower(username));

alter table public.profiles enable row level security;

-- Each user can see and manage only their own profile row. The username ->
-- user_id lookup needed at login time (before a session exists) goes through
-- the service-role client instead, which bypasses RLS entirely.
create policy "users_manage_own_profile" on public.profiles
  for all
  using (id = auth.uid())
  with check (id = auth.uid());

create table if not exists public.lists (
  id            uuid        primary key default gen_random_uuid(),
  owner_id      uuid        not null references auth.users(id) on delete cascade,
  title         text        not null,
  honoree_names text,                 -- antes couple_names: nome da homenageada/bebê
  headline      text        check (headline is null or char_length(headline) <= 160),
  kicker        text        check (kicker is null or char_length(kicker) <= 120),
  intro_message text,
  event_date    date,
  event_time    time,
  venue_name    text        check (venue_name is null or char_length(venue_name) <= 160),
  venue_address text        check (venue_address is null or char_length(venue_address) <= 200),
  venue_city    text        check (venue_city is null or char_length(venue_city) <= 120),
  share_token   text        not null unique default gen_slug(),
  status        text        not null default 'open' check (status in ('open', 'closed')),
  created_at    timestamptz not null default now()
);

create table if not exists public.gift_categories (
  id            uuid        primary key default gen_random_uuid(),
  list_id       uuid        not null references public.lists(id) on delete cascade,
  name          text        not null,
  display_order integer     not null default 0,
  created_at    timestamptz not null default now()
);

create table if not exists public.gifts (
  id            uuid        primary key default gen_random_uuid(),
  list_id       uuid        not null references public.lists(id) on delete cascade,
  name          text        not null,
  description   text,
  image_url     text,
  store_url     text,
  price         numeric(10,2),
  category_id   uuid        references public.gift_categories(id) on delete set null,
  max_count     integer     not null default 1 check (max_count >= 1),
  display_order integer     not null default 0,
  created_at    timestamptz not null default now()
);

create table if not exists public.selections (
  id         uuid        primary key default gen_random_uuid(),
  gift_id    uuid        not null references public.gifts(id) on delete cascade,
  guest_name text        not null,
  created_at timestamptz not null default now()
);

-- A message belongs to a LIST, not to a gift: one guest submission produces exactly
-- one message no matter how many gifts it reserved. Deliberately has no gift_id —
-- guests must never be able to map a name to a gift (FR-5.8), and omitting the
-- column makes that leak impossible rather than merely avoided.
create table if not exists public.list_messages (
  id         uuid        primary key default gen_random_uuid(),
  list_id    uuid        not null references public.lists(id) on delete cascade,
  guest_name text        not null check (char_length(btrim(guest_name)) > 0),
  message    text        not null check (
                           char_length(btrim(message)) > 0
                           and char_length(message) <= 1000   -- matches the zod cap
                         ),
  is_hidden  boolean     not null default false,
  created_at timestamptz not null default now()
);

-- ── Indexes ──────────────────────────────────────────────────────────────────

create index if not exists gifts_list_id_idx      on public.gifts(list_id);
create index if not exists gifts_display_order_idx on public.gifts(list_id, display_order);
create index if not exists selections_gift_id_idx  on public.selections(gift_id);
create index if not exists gift_categories_list_id_idx on public.gift_categories(list_id, display_order);
create unique index if not exists gift_categories_list_name_idx on public.gift_categories(list_id, lower(name));
create index if not exists gifts_category_id_idx on public.gifts(list_id, category_id);

-- Owner dashboard: whole list, newest first.
create index if not exists list_messages_list_id_idx
  on public.list_messages(list_id, created_at desc);

-- Public page: visible messages only, newest first.
create index if not exists list_messages_visible_idx
  on public.list_messages(list_id, created_at desc)
  where is_hidden = false;

-- ── Row-Level Security ────────────────────────────────────────────────────────

alter table public.lists          enable row level security;
alter table public.gifts          enable row level security;
alter table public.selections     enable row level security;
alter table public.gift_categories enable row level security;
alter table public.list_messages  enable row level security;

-- Lists: owners manage their own lists
create policy "owners_manage_lists" on public.lists
  for all
  using (owner_id = auth.uid());

-- Gifts: owners manage gifts on their own lists
create policy "owners_manage_gifts" on public.gifts
  for all
  using (
    exists (
      select 1 from public.lists
      where lists.id = gifts.list_id
        and lists.owner_id = auth.uid()
    )
  );

-- Selections: owners read selections on their own lists
create policy "owners_read_selections" on public.selections
  for select
  using (
    exists (
      select 1
      from public.gifts g
      join public.lists l on l.id = g.list_id
      where g.id = selections.gift_id
        and l.owner_id = auth.uid()
    )
  );

-- Categories: owners manage categories on their own lists
create policy "owners_manage_gift_categories" on public.gift_categories
  for all
  using (
    exists (
      select 1 from public.lists
      where lists.id = gift_categories.list_id
        and lists.owner_id = auth.uid()
    )
  );

-- Messages: owners manage (read/hide) messages on their own lists.
-- `for all using (...)` also gates INSERT: Postgres reuses the USING expression
-- as WITH CHECK when WITH CHECK is omitted.
-- No anon policy, consistent with the rest of the schema — the public page reads via
-- the service-role client and MUST filter is_hidden = false itself (BR-8).
create policy "owners_manage_list_messages" on public.list_messages
  for all
  using (
    exists (
      select 1 from public.lists
      where lists.id = list_messages.list_id
        and lists.owner_id = auth.uid()
    )
  );

-- ── Atomic slot-claim function ───────────────────────────────────────────────
-- Called server-side with the service role key; the FOR UPDATE lock prevents
-- two concurrent guests from both taking the last slot of a gift.

create or replace function public.claim_gift_slot(
  p_gift_id    uuid,
  p_guest_name text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_max_count  integer;
  v_slots_used bigint;
  v_new_id     uuid;
begin
  select max_count
  into   v_max_count
  from   public.gifts
  where  id = p_gift_id
  for update;

  if not found then
    return jsonb_build_object('success', false, 'error', 'Gift not found');
  end if;

  select count(*)
  into   v_slots_used
  from   public.selections
  where  gift_id = p_gift_id;

  if v_slots_used >= v_max_count then
    return jsonb_build_object('success', false, 'error', 'no_slots');
  end if;

  insert into public.selections (gift_id, guest_name)
  values (p_gift_id, p_guest_name)
  returning id into v_new_id;

  return jsonb_build_object('success', true, 'id', v_new_id);
end;
$$;
