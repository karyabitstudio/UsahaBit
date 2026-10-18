create or replace function public.current_workspace_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select wm.owner_id
      from public.workspace_members wm
      where wm.member_user_id = auth.uid()
        and wm.status = 'active'
      order by wm.created_at desc
      limit 1
    ),
    auth.uid()
  );
$$;

revoke all on function public.current_workspace_id() from public, anon;
grant execute on function public.current_workspace_id() to authenticated, service_role;
