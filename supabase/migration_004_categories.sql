-- Add optional gift categories, scoped per list.
-- Deleting a category does not delete its gifts; they fall back to "uncategorized".

create table if not exists public.gift_categories (
  id            uuid        primary key default gen_random_uuid(),
  list_id       uuid        not null references public.lists(id) on delete cascade,
  name          text        not null,
  display_order integer     not null default 0,
  created_at    timestamptz not null default now()
);

alter table public.gifts
  add column if not exists category_id uuid
  references public.gift_categories(id) on delete set null;

create index if not exists gift_categories_list_id_idx on public.gift_categories(list_id, display_order);
create unique index if not exists gift_categories_list_name_idx on public.gift_categories(list_id, lower(name));
create index if not exists gifts_category_id_idx on public.gifts(list_id, category_id);

alter table public.gift_categories enable row level security;

-- Categories: owners manage categories on their own lists (mirrors owners_manage_gifts)
create policy "owners_manage_gift_categories" on public.gift_categories
  for all
  using (
    exists (
      select 1 from public.lists
      where lists.id = gift_categories.list_id
        and lists.owner_id = auth.uid()
    )
  );
