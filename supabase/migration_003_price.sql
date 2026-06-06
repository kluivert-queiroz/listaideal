-- Add optional price field to gifts
alter table public.gifts add column if not exists price numeric(10,2);
