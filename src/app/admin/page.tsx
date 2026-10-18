import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Users, CircleDollarSign, ShieldCheck } from "lucide-react";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

const currency = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

export const instant = false;

export default async function AdminDashboardPage() {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) redirect("/admin/login");

  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  if (!user.email || !adminEmails.includes(user.email.toLowerCase())) {
    redirect("/login?error=not_admin");
  }

  const admin = createAdminClient();
  const [usersResult, invoicesResult, paidResult, recentResult, paidInvoicesResult] =
    await Promise.all([
      admin.from("profiles").select("id", { count: "exact", head: true }),
      admin.from("invoices").select("id", { count: "exact", head: true }),
      admin.from("invoices").select("id", { count: "exact", head: true }).eq("status", "paid"),
      admin
        .from("profiles")
        .select("id, email, full_name, business_name, plan, created_at")
        .order("created_at", { ascending: false })
        .limit(10),
      admin.from("invoices").select("total").eq("status", "paid"),
    ]);

  const queryError = usersResult.error || invoicesResult.error || paidResult.error || recentResult.error || paidInvoicesResult.error;
  if (queryError) {
    console.error("Admin dashboard query failed", queryError);
  }

  const paidTotal = (paidInvoicesResult.data || []).reduce(
    (sum, invoice) => sum + Number(invoice.total || 0),
    0,
  );
  const stats = [
    { label: "Total pengguna", value: usersResult.count ?? 0, icon: Users },
    { label: "Total invoice", value: invoicesResult.count ?? 0, icon: FileText },
    { label: "Invoice lunas", value: paidResult.count ?? 0, icon: ShieldCheck },
    { label: "Nilai invoice lunas", value: currency.format(paidTotal), icon: CircleDollarSign },
  ];

  return (
    <main className="mx-auto w-full max-w-6xl space-y-5 p-3 sm:space-y-8 sm:p-6 lg:p-10">
      <header>
        <Badge variant="outline" className="mb-3">Admin</Badge>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard Admin</h1>
        <p className="mt-2 text-muted-foreground">Ringkasan pengguna dan aktivitas invoice UsahaBit.</p>
      </header>

      {queryError && (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          Data admin gagal dimuat. Pastikan tabel Supabase tersedia dan SUPABASE_SERVICE_ROLE_KEY sudah diatur.
        </p>
      )}

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
              <Icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent><p className="break-words text-xl font-bold sm:text-2xl">{value}</p></CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Pengguna terbaru</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-3 pr-4 font-medium">Pengguna</th>
                  <th className="pb-3 pr-4 font-medium">Usaha</th>
                  <th className="pb-3 pr-4 font-medium">Paket</th>
                  <th className="pb-3 font-medium">Terdaftar</th>
                </tr>
              </thead>
              <tbody>
                {(recentResult.data || []).map((profile) => (
                  <tr key={profile.id} className="border-b last:border-0">
                    <td className="py-3 pr-4">
                      <p className="font-medium">{profile.full_name || "Tanpa nama"}</p>
                      <p className="text-xs text-muted-foreground">{profile.email || "-"}</p>
                    </td>
                    <td className="py-3 pr-4">{profile.business_name || "-"}</td>
                    <td className="py-3 pr-4">
                      <Badge variant={profile.plan === "free" ? "secondary" : "default"}>
                        {profile.plan || "free"}
                      </Badge>
                    </td>
                    <td className="py-3">
                      {profile.created_at
                        ? format(new Date(profile.created_at), "dd MMM yyyy", { locale: localeId })
                        : "-"}
                    </td>
                  </tr>
                ))}
                {!recentResult.data?.length && (
                  <tr><td colSpan={4} className="py-8 text-center text-muted-foreground">Belum ada data pengguna.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
