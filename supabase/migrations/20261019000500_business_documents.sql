create table if not exists public.business_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  template text not null check (template in ('quotation', 'work_order', 'receipt', 'task_letter', 'completion_report', 'payment_notice')),
  title text not null check (char_length(title) between 1 and 120),
  recipient text not null default '' check (char_length(recipient) <= 160),
  body text not null check (char_length(body) between 1 and 10000),
  amount numeric(15, 2),
  created_at timestamptz not null default now()
);

create index if not exists business_documents_user_created_idx
  on public.business_documents (user_id, created_at desc);

alter table public.business_documents enable row level security;
grant select, insert on public.business_documents to authenticated;
revoke all on public.business_documents from anon;

drop policy if exists "Users can read their business documents" on public.business_documents;
create policy "Users can read their business documents"
  on public.business_documents for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can create their business documents" on public.business_documents;
create policy "Users can create their business documents"
  on public.business_documents for insert
  to authenticated
  with check (auth.uid() = user_id);
