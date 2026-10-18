import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, File, TrendingUp, AlertCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { checkInvoiceLimit } from "@/lib/check-limits";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  const isAdmin = Boolean(user?.email && adminEmails.includes(user.email.toLowerCase()));

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  // Statistik
  const [
    { count: invoiceCount },
    { count: clientCount },
    { count: documentCount },
    { data: recentInvoices },
    limitInfo,
  ] = await Promise.all([
    supabase
      .from("invoices")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user!.id),
    supabase
      .from("clients")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user!.id),
    supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user!.id),
    supabase
      .from("invoices")
      .select("id, invoice_number, total, status, issue_date, clients(name)")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(5),
    checkInvoiceLimit(user!.id),
  ]);

  // Total pendapatan (invoice yang statusnya paid)
  const { data: paidInvoices } = await supabase
    .from("invoices")
    .select("total")
    .eq("user_id", user!.id)
    .eq("status", "paid");

  const totalRevenue =
    paidInvoices?.reduce((sum, inv) => sum + Number(inv.total), 0) || 0;

  const stats = [
    {
      title: "Total Invoice",
      value: invoiceCount || 0,
      icon: FileText,
      color: "text-blue-600",
    },
    {
      title: "Total Client",
      value: clientCount || 0,
      icon: Users,
      color: "text-green-600",
    },
    {
      title: "Surat Resmi",
      value: documentCount || 0,
      icon: File,
      color: "text-purple-600",
    },
    {
      title: "Pendapatan (Lunas)",
      value: new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(totalRevenue),
      icon: TrendingUp,
      color: "text-orange-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Dashboard</h1>
          <p className="text-muted-foreground">Ringkasan aktivitas bisnismu</p>
        </div>

        {/* Plan Badge */}
        <div className="flex items-center gap-3">
          {isAdmin && (
            <Button size="sm" variant="outline" asChild>
              <Link href="/admin">Admin</Link>
            </Button>
          )}
          <span className="text-sm text-muted-foreground">
            Paket: <strong className="capitalize">{limitInfo.plan}</strong>
          </span>
          {limitInfo.plan === "free" && (
            <Button size="sm" asChild>
              <Link href="/pricing">Upgrade</Link>
            </Button>
          )}
        </div>
      </div>

      {/* Warning Limit Free */}
      {limitInfo.plan === "free" && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <p className="font-medium text-amber-800">
              Sisa kuota invoice bulan ini: {limitInfo.remaining} dari{" "}
              {limitInfo.limit}
            </p>
            <p className="text-sm text-amber-700 mt-1">
              Upgrade ke Pro untuk unlimited invoice + tanpa watermark.
            </p>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="break-words text-xl font-bold sm:text-2xl">{stat.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Invoices + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Invoice Terbaru</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/invoices">Lihat Semua</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {recentInvoices && recentInvoices.length > 0 ? (
              <div className="space-y-3">
                {recentInvoices.map((inv: any) => (
                  <Link
                    key={inv.id}
                    href={`/dashboard/invoices/${inv.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 transition"
                  >
                    <div>
                      <p className="font-medium">{inv.invoice_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {inv.clients?.name || "Tanpa client"} •{" "}
                        {format(new Date(inv.issue_date), "dd MMM yyyy", {
                          locale: localeId,
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {new Intl.NumberFormat("id-ID", {
                          style: "currency",
                          currency: "IDR",
                          minimumFractionDigits: 0,
                        }).format(inv.total)}
                      </p>
                      <p className="text-xs capitalize text-muted-foreground">
                        {inv.status}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">
                Belum ada invoice
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" asChild>
              <Link href="/dashboard/invoices/new">+ Buat Invoice</Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/dashboard/clients/new">+ Tambah Client</Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link href="/dashboard/documents/new">+ Buat Surat</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
