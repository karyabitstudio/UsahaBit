import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

const statusMap: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
  }
> = {
  draft: { label: "Draft", variant: "secondary" },
  sent: { label: "Terkirim", variant: "default" },
  paid: { label: "Lunas", variant: "outline" },
  overdue: { label: "Terlambat", variant: "destructive" },
  cancelled: { label: "Dibatalkan", variant: "secondary" },
};

export default async function InvoicesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: invoices } = await supabase
    .from("invoices")
    .select(
      `
      *,
      clients (name)
    `,
    )
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Invoice</h1>
          <p className="text-muted-foreground">Kelola semua invoice</p>
        </div>
        <Link
          href="/dashboard/invoices/new"
          className={buttonVariants()}
        >
          <Plus className="h-4 w-4 mr-2" />
          Buat Invoice
        </Link>
      </div>

      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-muted/60 border-b">
            <tr>
              <th className="text-left p-4 font-medium">No. Invoice</th>
              <th className="text-left p-4 font-medium">Client</th>
              <th className="text-left p-4 font-medium">Tanggal</th>
              <th className="text-left p-4 font-medium">Total</th>
              <th className="text-left p-4 font-medium">Status</th>
              <th className="text-right p-4 font-medium">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {invoices && invoices.length > 0 ? (
              invoices.map((inv: any) => (
                <tr key={inv.id} className="border-b hover:bg-muted/50">
                  <td className="p-4 font-medium">{inv.invoice_number}</td>
                  <td className="p-4">{inv.clients?.name || "-"}</td>
                  <td className="p-4">
                    {format(new Date(inv.issue_date), "dd MMM yyyy", {
                      locale: localeId,
                    })}
                  </td>
                  <td className="p-4">
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      minimumFractionDigits: 0,
                    }).format(inv.total)}
                  </td>
                  <td className="p-4">
                    <Badge
                      variant={statusMap[inv.status]?.variant || "secondary"}
                    >
                      {statusMap[inv.status]?.label || inv.status}
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    <Link
                      href={`/dashboard/invoices/${inv.id}/edit`}
                      className={buttonVariants({ variant: "ghost", size: "sm" })}
                    >
                      Edit
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="p-12 text-center text-muted-foreground"
                >
                  Belum ada invoice.{" "}
                  <Link
                    href="/dashboard/invoices/new"
                    className="text-primary hover:underline"
                  >
                    Buat sekarang
                  </Link>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
