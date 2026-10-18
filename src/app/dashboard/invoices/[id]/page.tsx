import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Pencil, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { DownloadPdfButton } from "@/components/invoices/DownloadPdfButton";
import { SendWhatsAppButton } from "@/components/invoices/SendWhatsAppButton";
import { isAdminEmail } from "@/lib/admin-auth";
import { resolveWorkspaceOwnerId, getWorkspaceProfile } from "@/lib/workspace";

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

export default async function InvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const workspaceId = await resolveWorkspaceOwnerId(supabase, user!.id);

  const { data: invoice } = await supabase
    .from("invoices")
    .select(
      `
      *,
      clients (*),
      invoice_items (*)
    `,
    )
    .eq("id", id)
    .eq("user_id", workspaceId)
    .single();

  if (!invoice) notFound();

  const profile = await getWorkspaceProfile(workspaceId);
  const isAdmin = isAdminEmail(user?.email);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(value);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <Link
            href="/dashboard/invoices"
            className={buttonVariants({ variant: "ghost", size: "icon" })}
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
              {invoice.invoice_number}
            </h1>
            <p className="text-muted-foreground">
              {format(new Date(invoice.issue_date), "dd MMMM yyyy", {
                locale: localeId,
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant={statusMap[invoice.status]?.variant || "secondary"}>
            {statusMap[invoice.status]?.label || invoice.status}
          </Badge>
          <Link
            href={`/dashboard/invoices/${invoice.id}/edit`}
            className={buttonVariants({ variant: "outline" })}
          >
            <Pencil className="h-4 w-4 mr-2" />
            Edit
          </Link>
          <DownloadPdfButton
            invoice={invoice}
            profile={profile}
            client={invoice.clients}
            items={invoice.invoice_items || []}
            hasFullAccess={isAdmin}
          />
          <SendWhatsAppButton
            invoice={invoice}
            client={invoice.clients}
            profile={profile}
            hasFullAccess={isAdmin}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info Client & Tanggal */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Informasi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="text-muted-foreground mb-1">Client</p>
              <p className="font-medium">{invoice.clients?.name || "-"}</p>
              {invoice.clients?.email && (
                <p className="text-muted-foreground">{invoice.clients.email}</p>
              )}
              {invoice.clients?.phone && (
                <p className="text-muted-foreground">{invoice.clients.phone}</p>
              )}
              {invoice.clients?.address && (
                <p className="text-muted-foreground mt-1">
                  {invoice.clients.address}
                </p>
              )}
            </div>
            <div>
              <p className="text-muted-foreground mb-1">Tanggal Invoice</p>
              <p className="font-medium">
                {format(new Date(invoice.issue_date), "dd MMM yyyy", {
                  locale: localeId,
                })}
              </p>
            </div>
            {invoice.due_date && (
              <div>
                <p className="text-muted-foreground mb-1">Jatuh Tempo</p>
                <p className="font-medium">
                  {format(new Date(invoice.due_date), "dd MMM yyyy", {
                    locale: localeId,
                  })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Items + Total */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Detail Item</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium">Deskripsi</th>
                    <th className="text-right py-2 font-medium">Qty</th>
                    <th className="text-right py-2 font-medium">Harga</th>
                    <th className="text-right py-2 font-medium">Jumlah</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoice.invoice_items || []).map((item: any) => (
                    <tr key={item.id} className="border-b">
                      <td className="py-3">{item.description}</td>
                      <td className="py-3 text-right">{item.quantity}</td>
                      <td className="py-3 text-right">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="py-3 text-right">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-end">
              <div className="w-full max-w-64 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(invoice.subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Pajak</span>
                  <span>{formatCurrency(invoice.tax)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg border-t pt-2">
                  <span>Total</span>
                  <span>{formatCurrency(invoice.total)}</span>
                </div>
              </div>
            </div>

            {invoice.notes && (
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Catatan</p>
                <p className="text-sm">{invoice.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
