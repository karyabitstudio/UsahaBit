import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isPlanActive } from "@/lib/plan";
import { ReportsPanel } from "@/components/dashboard/ReportsPanel";
import { buttonVariants } from "@/components/ui/button";
import { isAdminEmail } from "@/lib/admin-auth";
import { getAccountProfile } from "@/lib/account";

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const accountId = user.id;
  const profile = await getAccountProfile(accountId);
  const isBusiness = isAdminEmail(user.email) || (profile?.plan === "business" && isPlanActive(profile.plan_expires_at));

  if (!isBusiness) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border bg-card p-8 text-center">
        <h1 className="text-xl font-bold">Laporan & Export Data</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Fitur laporan dan export data tersedia di paket Business.</p>
        <Link href="/pricing" className={buttonVariants({ className: "mt-5" })}>Lihat paket</Link>
      </div>
    );
  }

  const [{ data: invoiceRows }, { data: clientRows }] = await Promise.all([
    supabase.from("invoices").select("invoice_number, client_id, issue_date, due_date, status, subtotal, tax, total").eq("user_id", accountId).order("created_at", { ascending: false }),
    supabase.from("clients").select("id, name, email, phone, address").eq("user_id", accountId).order("name"),
  ]);

  const clientById = new Map((clientRows || []).map((client) => [client.id, client.name]));
  const invoices = (invoiceRows || []).map((invoice) => ({
    invoice_number: invoice.invoice_number,
    issue_date: invoice.issue_date,
    due_date: invoice.due_date,
    status: invoice.status,
    subtotal: Number(invoice.subtotal || 0),
    tax: Number(invoice.tax || 0),
    total: Number(invoice.total || 0),
    client_name: clientById.get(invoice.client_id) || "",
  }));
  const clients = (clientRows || []).map(({ name, email, phone, address }) => ({ name, email, phone, address }));

  return <ReportsPanel invoices={invoices} clients={clients} />;
}
