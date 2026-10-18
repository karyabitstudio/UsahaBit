"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, MousePointerClick, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

type ClickStat = { path: string; label: string; click_count: number; updated_at: string };

export function AdminClickStats() {
  const [items, setItems] = useState<ClickStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/click-stats", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Statistik gagal dimuat.");
      setItems(result.items);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Statistik gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);
  const total = useMemo(() => items.reduce((sum, item) => sum + Number(item.click_count || 0), 0), [items]);
  const formatter = new Intl.NumberFormat("id-ID");

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/admin" className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Kembali ke admin</Link>
          <p className="text-sm font-semibold text-primary">UsahaBit · Admin</p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold sm:text-3xl"><MousePointerClick className="h-6 w-6" />Statistik klik</h1>
          <p className="mt-1 text-sm text-muted-foreground">Jumlah klik pada tautan dan tombol di halaman publik.</p>
        </div>
        <Button variant="outline" onClick={() => void load()} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" />Muat ulang</Button>
      </header>

      {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      <section className="space-y-4 rounded-2xl border bg-card p-4 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-2"><div><p className="text-sm text-muted-foreground">Total klik tercatat</p><p className="text-3xl font-bold">{formatter.format(total)}</p></div><p className="text-xs text-muted-foreground">Diringkas menurut halaman dan tombol</p></div>
        {loading ? <p className="py-10 text-center text-sm text-muted-foreground">Memuat statistik…</p> : items.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Belum ada klik tercatat. Statistik mulai terkumpul setelah migrasi diterapkan dan pengunjung mengeklik halaman publik.</p> : (
          <div className="overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[540px] text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Halaman</th><th className="px-4 py-3 font-medium">Tombol / tautan</th><th className="px-4 py-3 text-right font-medium">Klik</th></tr></thead>
              <tbody>{items.map((item) => <tr key={`${item.path}:${item.label}`} className="border-t"><td className="px-4 py-3 font-mono text-xs">{item.path}</td><td className="px-4 py-3">{item.label}</td><td className="px-4 py-3 text-right font-semibold tabular-nums">{formatter.format(Number(item.click_count))}</td></tr>)}</tbody>
            </table>
          </div>
        )}
        <p className="text-xs text-muted-foreground">Angka ini menghitung klik di browser dan dapat mencakup klik berulang dari pengunjung yang sama.</p>
      </section>
    </main>
  );
}
