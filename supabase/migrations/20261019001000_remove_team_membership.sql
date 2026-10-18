-- Remove multi-user membership and return business data to per-account access.
do $$
declare
  target_table text;
  target_policy record;
begin
  foreach target_table in array array['clients', 'invoices', 'invoice_items', 'business_documents', 'catalog_products', 'support_tickets'] loop
    for target_policy in
      select p.polname
      from pg_policy p
      join pg_class tbl on tbl.oid = p.polrelid
      join pg_namespace ns on ns.oid = tbl.relnamespace
      where ns.nspname = 'public' and tbl.relname = target_table
    loop
      execute format('drop policy if exists %I on public.%I', target_policy.polname, target_table);
    end loop;
  end loop;
end $$;

drop function if exists public.current_workspace_id();

create policy "Users manage own clients"
  on public.clients for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users manage own invoices"
  on public.invoices for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users manage own invoice items"
  on public.invoice_items for all to authenticated
  using (exists (select 1 from public.invoices invoice where invoice.id = invoice_items.invoice_id and invoice.user_id = auth.uid()))
  with check (exists (select 1 from public.invoices invoice where invoice.id = invoice_items.invoice_id and invoice.user_id = auth.uid()));

create policy "Users manage own business documents"
  on public.business_documents for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users manage own catalog products"
  on public.catalog_products for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "Users view own support tickets"
  on public.support_tickets for select to authenticated
  using (user_id = auth.uid());

create policy "Users create own support tickets"
  on public.support_tickets for insert to authenticated
  with check (user_id = auth.uid());

drop table if exists public.workspace_notifications;
drop table if exists public.workspace_members;
