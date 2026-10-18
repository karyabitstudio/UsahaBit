alter table public.invoices
  add column if not exists template text not null default 'classic';

alter table public.invoices
  drop constraint if exists invoices_template_check;

alter table public.invoices
  add constraint invoices_template_check
  check (template in ('classic', 'modern', 'minimal'));
