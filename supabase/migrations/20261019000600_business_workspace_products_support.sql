create table if not exists public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  invited_email text not null,
  member_user_id uuid references auth.users(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'active')),
  created_at timestamptz not null default now(),
  unique (owner_id, invited_email),
  check (owner_id is distinct from member_user_id)
);

create index if not exists workspace_members_member_idx on public.workspace_members(member_user_id) where status = 'active';
create unique index if not exists workspace_members_one_active_team_idx on public.workspace_members(member_user_id) where status = 'active' and member_user_id is not null;
create unique index if not exists workspace_members_one_pending_email_idx on public.workspace_members(lower(invited_email)) where status = 'pending';
alter table public.workspace_members enable row level security;
grant select on public.workspace_members to authenticated;
revoke all on public.workspace_members from anon;

drop policy if exists "Owners and invited members can view workspace seats" on public.workspace_members;
create policy "Owners and invited members can view workspace seats"
  on public.workspace_members for select to authenticated
  using (auth.uid() = owner_id or auth.uid() = member_user_id);

create or replace function public.current_workspace_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select wm.owner_id from public.workspace_members wm where wm.member_user_id = auth.uid() and wm.status = 'active' limit 1),
    auth.uid()
  );
$$;
revoke all on function public.current_workspace_id() from public, anon;
grant execute on function public.current_workspace_id() to authenticated, service_role;

do $$
declare target_table text;
begin
  foreach target_table in array array['clients', 'invoices'] loop
    execute format('alter table public.%I enable row level security', target_table);
    execute format('drop policy if exists "Workspace members access %1$s" on public.%1$I', target_table);
    execute format('create policy "Workspace members access %1$s" on public.%1$I for all to authenticated using (user_id = public.current_workspace_id()) with check (user_id = public.current_workspace_id())', target_table);
  end loop;
end $$;

alter table public.invoice_items enable row level security;
drop policy if exists "Workspace members access invoice items" on public.invoice_items;
create policy "Workspace members access invoice items"
  on public.invoice_items for all to authenticated
  using (exists (select 1 from public.invoices i where i.id = invoice_items.invoice_id and i.user_id = public.current_workspace_id()))
  with check (exists (select 1 from public.invoices i where i.id = invoice_items.invoice_id and i.user_id = public.current_workspace_id()));

drop policy if exists "Workspace members access business documents" on public.business_documents;
create policy "Workspace members access business documents"
  on public.business_documents for all to authenticated
  using (user_id = public.current_workspace_id())
  with check (user_id = public.current_workspace_id());

create table if not exists public.catalog_products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  description text not null default '' check (char_length(description) <= 500),
  price numeric(15, 2) not null default 0 check (price >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists catalog_products_user_name_idx on public.catalog_products(user_id, name);
alter table public.catalog_products enable row level security;
grant select, insert, update, delete on public.catalog_products to authenticated;
revoke all on public.catalog_products from anon;
drop policy if exists "Workspace members manage catalog products" on public.catalog_products;
create policy "Workspace members manage catalog products"
  on public.catalog_products for all to authenticated
  using (user_id = public.current_workspace_id())
  with check (user_id = public.current_workspace_id());

create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject text not null check (char_length(subject) between 1 and 140),
  message text not null check (char_length(message) between 1 and 5000),
  plan text not null default 'free' check (plan in ('free', 'pro', 'business')),
  priority text not null default 'normal' check (priority in ('normal', 'priority', 'business')),
  status text not null default 'open' check (status in ('open', 'in_progress', 'answered', 'closed')),
  admin_reply text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists support_tickets_created_idx on public.support_tickets(created_at desc);
alter table public.support_tickets enable row level security;
grant select, insert on public.support_tickets to authenticated;
revoke all on public.support_tickets from anon;
drop policy if exists "Users can view own support tickets" on public.support_tickets;
create policy "Users can view own support tickets"
  on public.support_tickets for select to authenticated using (auth.uid() = user_id);
drop policy if exists "Workspace members can view support tickets" on public.support_tickets;
create policy "Workspace members can view support tickets"
  on public.support_tickets for select to authenticated using (user_id = public.current_workspace_id());
drop policy if exists "Users can create own support tickets" on public.support_tickets;
create policy "Users can create own support tickets"
  on public.support_tickets for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists "Workspace members can create support tickets" on public.support_tickets;
create policy "Workspace members can create support tickets"
  on public.support_tickets for insert to authenticated with check (user_id = public.current_workspace_id());
