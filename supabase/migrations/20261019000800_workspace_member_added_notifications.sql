alter table public.workspace_notifications
  drop constraint if exists workspace_notifications_kind_check;

alter table public.workspace_notifications
  add constraint workspace_notifications_kind_check
  check (kind in ('removed_from_workspace', 'added_to_workspace'));
