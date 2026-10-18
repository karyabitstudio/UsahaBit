import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { resolveWorkspaceOwnerId } from "@/lib/workspace";
import { buttonVariants } from "@/components/ui/button";
import { InvoiceListWorkspace } from "@/components/invoices/InvoiceListWorkspace";

export default async function InvoicesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const workspaceId = await resolveWorkspaceOwnerId(supabase, user.id);
  const { data: invoices } = await supabase.from("invoices").select("id, invoice_number, issue_date, due_date, status, total, clients(name)").eq("user_id", workspaceId).order("issue_date", { ascending: false });

  return <div className="mx-auto max-w-5xl space-y-6"><header className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-xl font-bold tracking-tight sm:text-2xl">Invoice</h1><p className="text-muted-foreground">Lihat, edit, atau hapus invoice yang sudah dibuat.</p></div><Link href="/dashboard/invoices/new" className={buttonVariants()}>Buat Invoice</Link></header><InvoiceListWorkspace invoices={(invoices || []) as any[]} /></div>;
}
