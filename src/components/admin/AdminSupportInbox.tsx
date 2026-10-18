"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

type Ticket = { id: string; email: string; subject: string; message: string; plan: string; priority: string; status: string; admin_reply: string | null; created_at: string; updated_at: string };
const priorities: Record<string, string> = { business: "Business · jalur khusus", priority: "Pro · prioritas", normal: "Gratis · standar" };
const statuses: Record<string, string> = { open: "Diterima", in_progress: "Sedang ditangani", answered: "Dibalas", closed: "Selesai" };

export function AdminSupportInbox() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [selectedStatuses, setSelectedStatuses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function loadTickets() {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/support", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Tiket gagal dimuat.");
      setTickets(result.tickets);
      setReplies(Object.fromEntries(result.tickets.map((ticket: Ticket) => [ticket.id, ticket.admin_reply || ""])));
      setSelectedStatuses(Object.fromEntries(result.tickets.map((ticket: Ticket) => [ticket.id, ticket.status])));
      setError(null);
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Tiket gagal dimuat."); }
    finally { setLoading(false); }
  }
  useEffect(() => { void loadTickets(); }, []);

  async function updateTicket(ticket: Ticket) {
    setSavingId(ticket.id); setError(null); setNotice(null);
    try {
      const response = await fetch("/api/admin/support", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: ticket.id, status: selectedStatuses[ticket.id] || ticket.status, reply: replies[ticket.id] || "" }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Tiket gagal diperbarui.");
      setTickets((current) => current.map((item) => item.id === ticket.id ? { ...item, ...result.ticket } : item));
      setNotice(`Tiket dari ${ticket.email} diperbarui.`);
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Tiket gagal diperbarui."); }
    finally { setSavingId(null); }
  }

  return <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6"><header className="flex flex-wrap items-center justify-between gap-4"><div><Link href="/admin" className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Kembali ke admin</Link><p className="text-sm font-semibold text-primary">UsahaBit · Admin</p><h1 className="mt-1 text-2xl font-bold sm:text-3xl">Inbox Support</h1><p className="mt-1 text-sm text-muted-foreground">Tiket Business dan Pro muncul lebih dulu di antrean.</p></div><Button variant="outline" onClick={() => void loadTickets()} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" />Muat ulang</Button></header>
    {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}{notice && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700">{notice}</p>}
    {loading ? <p className="py-12 text-center text-sm text-muted-foreground">Memuat tiket…</p> : tickets.length ? <div className="space-y-4">{tickets.map((ticket) => <article key={ticket.id} className="space-y-4 rounded-2xl border bg-card p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-primary">{priorities[ticket.priority] || ticket.priority}</p><h2 className="mt-1 text-lg font-semibold">{ticket.subject}</h2><p className="text-sm text-muted-foreground">{ticket.email} · {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(ticket.created_at))}</p></div><span className="rounded-full bg-muted px-3 py-1 text-xs">{statuses[ticket.status] || ticket.status}</span></div><p className="whitespace-pre-wrap rounded-xl bg-muted/40 p-4 text-sm leading-6">{ticket.message}</p><div className="grid gap-3 sm:grid-cols-[200px_1fr]"><select aria-label="Status tiket" value={selectedStatuses[ticket.id] || ticket.status} onChange={(event) => setSelectedStatuses((current) => ({ ...current, [ticket.id]: event.target.value }))} className="h-10 rounded-lg border bg-background px-3 text-sm"><option value="open">Diterima</option><option value="in_progress">Sedang ditangani</option><option value="answered">Dibalas</option><option value="closed">Selesai</option></select><textarea aria-label="Balasan untuk pengguna" rows={3} maxLength={5000} value={replies[ticket.id] || ""} onChange={(event) => setReplies((current) => ({ ...current, [ticket.id]: event.target.value }))} placeholder="Tulis balasan untuk pengguna…" className="rounded-lg border bg-background px-3 py-2 text-sm" /></div><Button size="sm" disabled={savingId === ticket.id} onClick={() => void updateTicket(ticket)}><Send className="mr-2 h-4 w-4" />{savingId === ticket.id ? "Menyimpan…" : "Simpan balasan & status"}</Button></article>)}</div> : <div className="rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground">Belum ada tiket support.</div>}
  </main>;
}
