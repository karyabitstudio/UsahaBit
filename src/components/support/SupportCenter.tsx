"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

type Ticket = { id: string; subject: string; message: string; plan: string; priority: string; status: string; admin_reply: string | null; created_at: string };
const statusLabels: Record<string, string> = { open: "Diterima", in_progress: "Sedang ditangani", answered: "Dibalas", closed: "Selesai" };

export function SupportCenter() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [plan, setPlan] = useState("free");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function loadTickets() {
    setLoading(true);
    try {
      const response = await fetch("/api/dashboard/support", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Support gagal dimuat.");
      setTickets(result.tickets); setPlan(result.plan); setError(null);
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Support gagal dimuat."); }
    finally { setLoading(false); }
  }

  useEffect(() => { void loadTickets(); }, []);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(null); setNotice(null);
    try {
      const response = await fetch("/api/dashboard/support", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subject, message }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Pesan gagal dikirim.");
      setTickets((current) => [result.ticket, ...current]); setSubject(""); setMessage(""); setNotice("Pesan terkirim. Balasan admin akan muncul di riwayat support.");
    } catch (submitError) { setError(submitError instanceof Error ? submitError.message : "Pesan gagal dikirim."); }
    finally { setSaving(false); }
  }

  const priority = plan === "business" ? "Jalur Business" : plan === "pro" ? "Prioritas Pro" : "Antrean standar";
  return (
    <div className="mx-auto max-w-3xl space-y-6"><header><p className="text-sm font-semibold text-primary">Bantuan UsahaBit</p><h1 className="mt-1 text-2xl font-bold sm:text-3xl">Pusat Support</h1><p className="mt-1 text-sm text-muted-foreground">Tiket akan ditangani admin, balasan dan statusnya tampil di sini.</p></header>
      <div className="rounded-xl border bg-card p-4 text-sm"><span className="font-semibold">Layanan paket saat ini: </span>{priority}</div>
      {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}{notice && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700">{notice}</p>}
      <form onSubmit={submit} className="space-y-4 rounded-2xl border bg-card p-5 sm:p-6"><h2 className="font-semibold">Kirim pertanyaan</h2><input required maxLength={140} value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Subjek" className="h-10 w-full rounded-lg border bg-background px-3 text-sm" /><textarea required maxLength={5000} rows={5} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Ceritakan kendala atau pertanyaanmu…" className="w-full rounded-lg border bg-background px-3 py-3 text-sm" /><Button disabled={saving}>{saving ? "Mengirim…" : "Kirim ke support"}</Button></form>
      <section className="space-y-3 rounded-2xl border bg-card p-5 sm:p-6"><h2 className="font-semibold">Riwayat tiket</h2>{loading ? <p className="py-6 text-sm text-muted-foreground">Memuat tiket…</p> : tickets.length ? tickets.map((ticket) => <article key={ticket.id} className="space-y-3 rounded-xl border p-4"><div className="flex flex-wrap items-center justify-between gap-2"><h3 className="font-semibold">{ticket.subject}</h3><span className="rounded-full bg-muted px-2.5 py-1 text-xs">{statusLabels[ticket.status] || ticket.status}</span></div><p className="whitespace-pre-wrap text-sm text-muted-foreground">{ticket.message}</p>{ticket.admin_reply && <div className="rounded-lg bg-primary/5 p-3 text-sm"><p className="mb-1 font-semibold text-primary">Balasan admin</p><p className="whitespace-pre-wrap">{ticket.admin_reply}</p></div>}</article>) : <p className="py-6 text-sm text-muted-foreground">Belum ada tiket support.</p>}</section>
    </div>
  );
}
