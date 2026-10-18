import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  ChartNoAxesCombined,
  FileText,
  Package,
  ShieldCheck,
  Users,
  UsersRound,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin-auth";
import { getEffectivePlan } from "@/lib/plan";
import { getWorkspaceProfile, resolveWorkspaceOwnerId } from "@/lib/workspace";
import { buttonVariants } from "@/components/ui/button";

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

const statusLabels: Record<string, string> = {
  draft: "Draft",
  sent: "Terkirim",
  paid: "Lunas",
  overdue: "Terlambat",
  cancelled: "Dibatalkan",
};

export default async function DashboardHomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const workspaceId = await resolveWorkspaceOwnerId(supabase, user.id);
  const [profile, invoiceCountResult, clientCountResult, invoiceRowsResult] = await Promise.all([
    getWorkspaceProfile(workspaceId),
    supabase.from("invoices").select("id", { count: "exact", head: true }).eq("user_id", workspaceId),
    supabase.from("clients").select("id", { count: "exact", head: true }).eq("user_id", workspaceId),
    supabase.from("invoices").select("id, invoice_number, status, total, issue_date").eq("user_id", workspaceId).order("created_at", { ascending: false }).limit(5),
  ]);

  const isAdmin = isAdminEmail(user.email);
  const plan = isAdmin ? "business" : getEffectivePlan(profile?.plan, profile?.plan_expires_at || null);
  const invoices = invoiceRowsResult.data || [];
  const stats = [
    { label: "Total invoice", value: String(invoiceCountResult.count || 0), icon: FileText },
    { label: "Total klien", value: String(clientCountResult.count || 0), icon: Users },
    { label: isAdmin ? "Akses admin" : "Paket aktif", value: isAdmin ? "Pro + Business" : plan === "business" ? "Business" : plan === "pro" ? "Pro" : "Gratis", icon: ShieldCheck },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-primary">Ruang kerja UsahaBit</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">Dashboard utama</h1>
          <p className="mt-2 text-sm text-muted-foreground">{profile?.business_name || "Ringkasan aktivitas dan alat usahamu."}</p>
        </div>
        <Link href="/dashboard/invoices/new" className={buttonVariants()}><FileText className="mr-2 h-4 w-4" />Buat invoice</Link>
      </header>

      {isAdmin && <section className="rounded-2xl border border-primary/25 bg-primary/[.04] p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><ShieldCheck className="h-5 w-5" /></span>
          <div><h2 className="font-semibold">Akses admin: fitur Pro dan Business aktif</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Admin dapat membuka fitur dari kedua paket untuk workspace ini. Paket pengguna lain tidak berubah.</p></div>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <article className="rounded-xl border bg-card p-4"><div className="flex items-center gap-2 font-semibold"><Package className="h-4 w-4 text-primary" />Fitur Pro</div><p className="mt-2 text-sm leading-6 text-muted-foreground">Katalog produk dan jasa, template invoice, branding, serta penggunaan tanpa batas paket gratis.</p><div className="mt-4 flex flex-wrap gap-2"><Link href="/dashboard/products" className={buttonVariants({ size: "sm", variant: "outline" })}>Katalog produk</Link><Link href="/dashboard/invoices" className={buttonVariants({ size: "sm", variant: "outline" })}>Template invoice</Link></div></article>
          <article className="rounded-xl border bg-card p-4"><div className="flex items-center gap-2 font-semibold"><UsersRound className="h-4 w-4 text-primary" />Fitur Business</div><p className="mt-2 text-sm leading-6 text-muted-foreground">Semua fitur Pro, laporan, pengelolaan anggota tim, dan antrean support Business.</p><div className="mt-4 flex flex-wrap gap-2"><Link href="/dashboard/reports" className={buttonVariants({ size: "sm", variant: "outline" })}><ChartNoAxesCombined className="mr-2 h-4 w-4" />Laporan</Link><Link href="/dashboard/team" className={buttonVariants({ size: "sm", variant: "outline" })}>Anggota tim</Link><Link href="/dashboard/support" className={buttonVariants({ size: "sm", variant: "outline" })}>Support</Link></div></article>
        </div>
        <Link href="/admin" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">Buka panel admin <ArrowRight className="h-4 w-4" /></Link>
      </section>}

      <section className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => <article key={stat.label} className="rounded-2xl border bg-card p-5"><div className="flex items-center justify-between gap-3"><p className="text-sm text-muted-foreground">{stat.label}</p><stat.icon className="h-5 w-5 text-primary" /></div><p className="mt-3 text-2xl font-bold">{stat.value}</p></article>)}
      </section>

      <section className="rounded-2xl border bg-card p-5 sm:p-6">
        <div><h2 className="text-lg font-semibold">Invoice terbaru</h2><p className="mt-1 text-sm text-muted-foreground">Invoice terakhir yang dibuat di workspace ini.</p></div>
        {invoices.length ? <div className="mt-4 divide-y">{invoices.map((invoice) => <article key={invoice.id} className="flex flex-wrap items-center justify-between gap-3 py-3"><div><p className="font-medium">{invoice.invoice_number || "Invoice"}</p><p className="mt-1 text-xs text-muted-foreground">{invoice.issue_date ? new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(`${invoice.issue_date}T00:00:00`)) : "Tanggal belum diatur"} - {statusLabels[invoice.status] || invoice.status}</p></div><p className="font-semibold tabular-nums">{formatCurrency(Number(invoice.total))}</p></article>)}</div> : <div className="mt-5 rounded-xl border border-dashed p-8 text-center"><FileText className="mx-auto h-8 w-8 text-muted-foreground" /><p className="mt-3 font-medium">Belum ada invoice</p><p className="mt-1 text-sm text-muted-foreground">Buat invoice pertama untuk mulai memakai dashboard.</p><Link href="/dashboard/invoices/new" className={buttonVariants({ size: "sm", className: "mt-4" })}>Buat invoice</Link></div>}
      </section>
    </div>
  );
}
