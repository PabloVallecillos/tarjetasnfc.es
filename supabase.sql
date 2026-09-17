create table if not exists public.cards (
  card_id text primary key,
  owner_id uuid references auth.users(id) on delete cascade,
  redirect_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint cards_card_id_format check (card_id ~ '^[A-Za-z0-9_-]{3,64}$'),
  constraint cards_redirect_url_format check (redirect_url is null or redirect_url ~ '^https?://')
);

create index if not exists cards_owner_id_idx on public.cards(owner_id);

alter table public.cards enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update on public.cards to authenticated;

drop policy if exists "Users can read own cards" on public.cards;
drop policy if exists "Users can read unowned cards" on public.cards;
drop policy if exists "Users can read claimable cards" on public.cards;
drop policy if exists "Users can claim new cards" on public.cards;
drop policy if exists "Users can update own cards" on public.cards;
drop policy if exists "Users can claim unowned cards" on public.cards;
drop policy if exists "Users can update claimable cards" on public.cards;

create policy "Users can read claimable cards"
on public.cards for select
to authenticated
using (owner_id = (select auth.uid()) or owner_id is null);

create policy "Users can claim new cards"
on public.cards for insert
to authenticated
with check (owner_id = (select auth.uid()));

create policy "Users can update claimable cards"
on public.cards for update
to authenticated
using (owner_id = (select auth.uid()) or owner_id is null)
with check (owner_id = (select auth.uid()));

create or replace function public.set_cards_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists cards_set_updated_at on public.cards;
create trigger cards_set_updated_at
before update on public.cards
for each row execute function public.set_cards_updated_at();
