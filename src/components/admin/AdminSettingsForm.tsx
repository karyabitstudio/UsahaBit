"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, CreditCard, LifeBuoy, LogOut, Save } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { SiteSettings } from "@/lib/site-settings";

export function AdminSettingsForm({ initialSettings }: { initialSettings: SiteSettings }) {
  const router = useRouter();
  const [settings, setSettings] = useState(initialSettings);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function updateText(field: "heroBadge" | "heroTitle" | "heroAccent" | "heroDescription" | "salesWhatsapp", value: string) {
    setSettings((current) => ({ ...current, [field]: value }));
  }

  function updatePrice(field: keyof SiteSettings["pricing"], value: string) {
    setSettings((current) => ({ ...current, pricing: { ...current.pricing, [field]: Number(value) } }));
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);
    try {
      const response = await fetch("/api/site-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Pengaturan gagal disimpan.");
      setSettings(result.settings);
      setMessage("Perubahan berhasil disimpan dan langsung tampil di situs.");
      router.refresh();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Pengaturan gagal disimpan.");
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  const priceFields: { key: keyof SiteSettings["pricing"]; label: string }[] = [
    { key: "proMonthly", label: "Pro per bulan" },
    { key: "proYearly", label: "Pro per tahun" },
    { key: "businessMonthly", label: "Business per bulan" },
    { key: "businessYearly", label: "Business per tahun" },
  ];

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6">
      <header className="flex items-center justify-between gap-4">
        <div><p className="text-sm font-semibold text-primary">UsahaBit</p><h1 className="mt-1 text-2xl font-bold sm:text-3xl">Pengaturan situs</h1><p className="mt-1 text-sm text-muted-foreground">Ubah konten beranda, harga paket, dan kontak tanpa menyentuh kode.</p></div>
        <div className="flex flex-wrap gap-2"><Link href="/admin/support" className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium transition-colors hover:bg-muted"><LifeBuoy className="mr-2 h-4 w-4" />Support Inbox</Link><Link href="/admin/analytics" className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium transition-colors hover:bg-muted"><BarChart3 className="mr-2 h-4 w-4" />Statistik klik</Link><Link href="/admin/users" className="inline-flex h-8 items-center justify-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium transition-colors hover:bg-muted"><CreditCard className="mr-2 h-4 w-4" />Kelola paket user</Link><Button type="button" variant="outline" onClick={logout}><LogOut className="mr-2 h-4 w-4" />Keluar</Button></div>
      </header>

      <form onSubmit={save} className="space-y-6">
        {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        {message && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-600">{message}</p>}

        <section className="space-y-4 rounded-2xl border bg-card p-5 sm:p-7">
          <div><h2 className="text-lg font-semibold">Konten beranda</h2><p className="text-sm text-muted-foreground">Teks yang tampil di bagian utama halaman depan.</p></div>
          <div className="space-y-2"><Label htmlFor="heroBadge">Label kecil</Label><Input id="heroBadge" value={settings.heroBadge} onChange={(event) => updateText("heroBadge", event.target.value)} required maxLength={100} /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="heroTitle">Judul utama</Label><Input id="heroTitle" value={settings.heroTitle} onChange={(event) => updateText("heroTitle", event.target.value)} required maxLength={100} /></div>
            <div className="space-y-2"><Label htmlFor="heroAccent">Teks aksen judul</Label><Input id="heroAccent" value={settings.heroAccent} onChange={(event) => updateText("heroAccent", event.target.value)} required maxLength={100} /></div>
          </div>
          <div className="space-y-2"><Label htmlFor="heroDescription">Deskripsi</Label><Textarea id="heroDescription" value={settings.heroDescription} onChange={(event) => updateText("heroDescription", event.target.value)} required maxLength={300} rows={3} /></div>
        </section>

        <section className="space-y-4 rounded-2xl border bg-card p-5 sm:p-7">
          <div><h2 className="text-lg font-semibold">Harga paket</h2><p className="text-sm text-muted-foreground">Harga dalam Rupiah. Isi angka tanpa titik atau simbol.</p></div>
          <div className="grid gap-4 sm:grid-cols-2">{priceFields.map((field) => <div key={field.key} className="space-y-2"><Label htmlFor={field.key}>{field.label}</Label><Input id={field.key} type="number" min="0" max="100000000" step="1000" value={settings.pricing[field.key]} onChange={(event) => updatePrice(field.key, event.target.value)} required /></div>)}</div>
        </section>

        <section className="space-y-4 rounded-2xl border bg-card p-5 sm:p-7">
          <div><h2 className="text-lg font-semibold">Kontak penjualan</h2><p className="text-sm text-muted-foreground">Nomor ini menerima pesan otomatis saat pengunjung memilih paket.</p></div>
          <div className="space-y-2"><Label htmlFor="salesWhatsapp">Nomor WhatsApp</Label><Input id="salesWhatsapp" inputMode="tel" placeholder="6281234567890" value={settings.salesWhatsapp} onChange={(event) => updateText("salesWhatsapp", event.target.value)} /><p className="text-xs text-muted-foreground">Gunakan kode negara tanpa tanda +, contoh 62812…</p></div>
        </section>

        <Button type="submit" disabled={saving}><Save className="mr-2 h-4 w-4" />{saving ? "Menyimpan..." : "Simpan perubahan"}</Button>
      </form>
    </div>
  );
}
