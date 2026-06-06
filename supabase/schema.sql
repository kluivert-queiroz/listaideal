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

create table if not exists public.lists (
  id           uuid        primary key default gen_random_uuid(),
  owner_id     uuid        not null references auth.users(id) on delete cascade,
  title        text        not null,
  couple_names text,
  intro_message text,
  event_date   date,
  share_token  text        not null unique default gen_slug(),
  status       text        not null default 'open' check (status in ('open', 'closed')),
  created_at   timestamptz not null default now()
);

create table if not exists public.gifts (
  id            uuid        primary key default gen_random_uuid(),
  list_id       uuid        not null references public.lists(id) on delete cascade,
  name          text        not null,
  description   text,
  image_url     text,
  store_url     text,
  price         numeric(10,2),
  max_count     integer     not null default 1 check (max_count >= 1),
  display_order integer     not null default 0,
  created_at    timestamptz not null default now()
);

create table if not exists public.selections (
  id         uuid        primary key default gen_random_uuid(),
  gift_id    uuid        not null references public.gifts(id) on delete cascade,
  guest_name text        not null,
  message    text,
  created_at timestamptz not null default now()
);

-- ── Indexes ──────────────────────────────────────────────────────────────────

create index if not exists gifts_list_id_idx      on public.gifts(list_id);
create index if not exists gifts_display_order_idx on public.gifts(list_id, display_order);
create index if not exists selections_gift_id_idx  on public.selections(gift_id);

-- ── Row-Level Security ────────────────────────────────────────────────────────

alter table public.lists      enable row level security;
alter table public.gifts      enable row level security;
alter table public.selections enable row level security;

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

-- ── Atomic slot-claim function ───────────────────────────────────────────────
-- Called server-side with the service role key; the FOR UPDATE lock prevents
-- two concurrent guests from both taking the last slot of a gift.

create or replace function public.claim_gift_slot(
  p_gift_id   uuid,
  p_guest_name text,
  p_message   text
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

  insert into public.selections (gift_id, guest_name, message)
  values (
    p_gift_id,
    p_guest_name,
    nullif(trim(coalesce(p_message, '')), '')
  )
  returning id into v_new_id;

  return jsonb_build_object('success', true, 'id', v_new_id);
end;
$$;
