create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint site_settings_public_key check (key = 'public')
);

alter table public.site_settings enable row level security;
grant select on public.site_settings to anon, authenticated;
grant all on public.site_settings to service_role;

drop policy if exists "Public can read site settings" on public.site_settings;
create policy "Public can read site settings"
  on public.site_settings for select
  to anon, authenticated
  using (key = 'public');

insert into public.site_settings (key, value)
values (
  'public',
  '{
    "heroBadge": "Administrasi usaha, lebih sederhana",
    "heroTitle": "Dokumen usaha rapi,",
    "heroAccent": "tanpa ribet.",
    "heroDescription": "Buat invoice profesional untuk bisnismu dalam hitungan menit, langsung dari browser.",
    "salesWhatsapp": "",
    "pricing": {
      "proMonthly": 69000,
      "proYearly": 629000,
      "businessMonthly": 135000,
      "businessYearly": 1169000
    }
  }'::jsonb
)
on conflict (key) do nothing;
