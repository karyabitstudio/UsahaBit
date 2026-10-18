"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronLeft, ChevronRight, LogOut, RefreshCw, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

type UserRow = {
  id: string;
  email: string;
  fullName: string;
  businessName: string;
  plan: string;
  planExpiresAt: string | null;
  isPlanActive: boolean;
};

const planNames: Record<string, string> = { free: "Gratis", pro: "Pro", business: "Business" };

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(value));
}

export function AdminUsersPanel() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedPlans, setSelectedPlans] = useState<Record<string, string>>({});
  const [periods, setPeriods] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadUsers = useCallback(async (targetPage: number) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/admin/users?page=${targetPage}`, { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Daftar pengguna gagal dimuat.");
      setUsers(result.users);
      setPage(result.page);
      setHasNextPage(result.hasNextPage);
      setSelectedPlans(Object.fromEntries(result.users.map((user: UserRow) => [user.id, user.plan])));
      setPeriods((current) => Object.fromEntries(result.users.map((user: UserRow) => [user.id, current[user.id] || "monthly"])));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Daftar pengguna gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadUsers(1); }, [loadUsers]);

  async function updatePackage(user: UserRow) {
    const plan = selectedPlans[user.id] || "free";
    if (plan !== "free" && !window.confirm(`Pastikan pembayaran ${user.email} sudah diterima. Aktifkan paket ${planNames[plan]}?`)) return;
    setSavingId(user.id);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, plan, period: periods[user.id] || "monthly" }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Paket gagal diperbarui.");
      setUsers((current) => current.map((item) => item.id === user.id
        ? { ...item, plan: result.user.plan, planExpiresAt: result.user.plan_expires_at, isPlanActive: result.user.plan === "free" || Boolean(result.user.plan_expires_at && new Date(result.user.plan_expires_at) > new Date()) }
        : item));
      setMessage(`Paket ${user.email} berhasil diubah menjadi ${planNames[plan]}.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Paket gagal diperbarui.");
    } finally {
      setSavingId(null);
    }
  }

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  const visibleUsers = users.filter((user) =>
    `${user.email} ${user.fullName} ${user.businessName}`.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/admin" className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Kembali ke pengaturan</Link>
          <p className="text-sm font-semibold text-primary">UsahaBit · Admin</p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold sm:text-3xl"><Users className="h-6 w-6" />Kelola paket pengguna</h1>
          <p className="mt-1 text-sm text-muted-foreground">Konfirmasi pembayaran secara manual sebelum mengaktifkan paket berbayar.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => loadUsers(page)} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" />Muat ulang</Button>
          <Button variant="outline" onClick={logout}><LogOut className="mr-2 h-4 w-4" />Keluar</Button>
        </div>
      </header>

      {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {message && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-600">{message}</p>}

      <section className="space-y-4 rounded-2xl border bg-card p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><h2 className="font-semibold">Pengguna terdaftar</h2><p className="text-sm text-muted-foreground">Halaman {page} · maksimal 50 pengguna per halaman</p></div>
          <input aria-label="Cari pengguna" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Cari nama, usaha, atau email" className="h-9 w-full rounded-lg border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring sm:max-w-xs" />
        </div>

        {loading ? <p className="py-10 text-center text-sm text-muted-foreground">Memuat pengguna…</p> : visibleUsers.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Tidak ada pengguna yang cocok.</p> : (
          <div className="space-y-3">
            {visibleUsers.map((user) => {
              const selectedPlan = selectedPlans[user.id] || "free";
              return (
                <article key={user.id} className="grid gap-4 rounded-xl border p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{user.fullName || user.businessName || user.email}</p>
                    {(user.fullName || user.businessName) && <p className="truncate text-sm text-muted-foreground">{user.businessName}{user.businessName && user.fullName ? " · " : ""}{user.email}</p>}
                    {!(user.fullName || user.businessName) && <p className="truncate text-sm text-muted-foreground">{user.email}</p>}
                    <p className="mt-1 text-xs text-muted-foreground">Paket saat ini: <span className="font-medium text-foreground">{planNames[user.plan] || user.plan}</span>{user.plan !== "free" && <> · berlaku sampai {formatDate(user.planExpiresAt)}{!user.isPlanActive && <span className="ml-1 font-medium text-destructive">(kedaluwarsa, akses Gratis)</span>}</>}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select aria-label={`Paket baru untuk ${user.email}`} value={selectedPlan} onChange={(event) => setSelectedPlans((current) => ({ ...current, [user.id]: event.target.value }))} className="h-9 rounded-lg border bg-background px-2 text-sm">
                      <option value="free">Gratis</option><option value="pro">Pro</option><option value="business">Business</option>
                    </select>
                    {selectedPlan !== "free" && <select aria-label={`Masa aktif untuk ${user.email}`} value={periods[user.id] || "monthly"} onChange={(event) => setPeriods((current) => ({ ...current, [user.id]: event.target.value }))} className="h-9 rounded-lg border bg-background px-2 text-sm"><option value="monthly">1 bulan</option><option value="yearly">1 tahun</option></select>}
                    <Button size="sm" disabled={savingId === user.id} onClick={() => updatePackage(user)}>{savingId === user.id ? "Menyimpan…" : selectedPlan === user.plan && selectedPlan !== "free" ? "Perpanjang paket" : selectedPlan === user.plan ? "Paket aktif" : "Simpan paket"}</Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        <div className="flex justify-end gap-2 border-t pt-4">
          <Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => loadUsers(page - 1)}><ChevronLeft className="mr-1 h-4 w-4" />Sebelumnya</Button>
          <Button variant="outline" size="sm" disabled={!hasNextPage || loading} onClick={() => loadUsers(page + 1)}>Berikutnya<ChevronRight className="ml-1 h-4 w-4" /></Button>
        </div>
      </section>
    </main>
  );
}
