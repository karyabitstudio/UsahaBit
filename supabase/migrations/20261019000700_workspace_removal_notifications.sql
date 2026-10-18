create table if not exists public.workspace_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind = 'removed_from_workspace'),
  workspace_name text not null default 'workspace',
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists workspace_notifications_unread_idx
  on public.workspace_notifications(user_id, created_at desc)
  where read_at is null;

alter table public.workspace_notifications enable row level security;
grant select on public.workspace_notifications to authenticated;
grant update (read_at) on public.workspace_notifications to authenticated;
grant all on public.workspace_notifications to service_role;
revoke all on public.workspace_notifications from anon;

drop policy if exists "Users view own workspace notifications" on public.workspace_notifications;
create policy "Users view own workspace notifications"
  on public.workspace_notifications for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users dismiss own workspace notifications" on public.workspace_notifications;
create policy "Users dismiss own workspace notifications"
  on public.workspace_notifications for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
