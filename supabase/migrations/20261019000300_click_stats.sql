create table if not exists public.click_stats (
  path text not null,
  label text not null,
  click_count bigint not null default 0 check (click_count >= 0),
  updated_at timestamptz not null default now(),
  primary key (path, label)
);

alter table public.click_stats enable row level security;
revoke all on public.click_stats from anon, authenticated;
grant all on public.click_stats to service_role;

create or replace function public.increment_click_stat(p_path text, p_label text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.click_stats (path, label, click_count, updated_at)
  values (left(p_path, 160), left(p_label, 80), 1, now())
  on conflict (path, label)
  do update set click_count = public.click_stats.click_count + 1, updated_at = now();
$$;

revoke all on function public.increment_click_stat(text, text) from public, anon, authenticated;
grant execute on function public.increment_click_stat(text, text) to service_role;
