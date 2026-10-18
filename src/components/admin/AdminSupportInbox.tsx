"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Bell, BellOff, RefreshCw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";

type Ticket = { id: string; email: string; subject: string; message: string; plan: string; priority: string; status: string; admin_reply: string | null; created_at: string; updated_at: string };
const priorities: Record<string, string> = { business: "Business · jalur khusus", priority: "Pro · prioritas", normal: "Gratis · standar" };
const statuses: Record<string, string> = { open: "Diterima", in_progress: "Sedang ditangani", answered: "Dibalas", closed: "Selesai" };

function playNotificationTone(audioContext: AudioContext) {
  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const startTime = audioContext.currentTime;

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(880, startTime);
  oscillator.frequency.setValueAtTime(660, startTime + 0.14);
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(0.18, startTime + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.36);
  oscillator.connect(gain);
  gain.connect(audioContext.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + 0.36);
}

export function AdminSupportInbox() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [selectedStatuses, setSelectedStatuses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const soundEnabledRef = useRef(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const knownTicketIdsRef = useRef<Set<string> | null>(null);
  const loadingTicketsRef = useRef(false);

  async function loadTickets(showLoading = true) {
    if (loadingTicketsRef.current) return;
    loadingTicketsRef.current = true;
    if (showLoading) setLoading(true);
    try {
      const response = await fetch("/api/admin/support", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Tiket gagal dimuat.");
      setError(null);
      const nextTickets = result.tickets as Ticket[];
      const knownTicketIds = knownTicketIdsRef.current;
      if (knownTicketIds) {
        const newTickets = nextTickets.filter((ticket) => !knownTicketIds.has(ticket.id));
        if (newTickets.length > 0) {
          setNotice(`${newTickets.length} tiket support baru masuk.`);
          if (soundEnabledRef.current && audioContextRef.current) {
            try {
              playNotificationTone(audioContextRef.current);
            } catch (soundError) {
              console.error("Unable to play support notification sound:", soundError);
              setError("Tiket baru masuk, tetapi bunyi notifikasi gagal diputar.");
            }
          }
        }
      }
      knownTicketIdsRef.current = new Set(nextTickets.map((ticket) => ticket.id));
      setTickets(nextTickets);
      setReplies((current) => Object.fromEntries(nextTickets.map((ticket) => [ticket.id, current[ticket.id] ?? ticket.admin_reply ?? ""])));
      setSelectedStatuses((current) => Object.fromEntries(nextTickets.map((ticket) => [ticket.id, current[ticket.id] ?? ticket.status])));
    } catch (loadError) { setError(loadError instanceof Error ? loadError.message : "Tiket gagal dimuat."); }
    finally {
      loadingTicketsRef.current = false;
      if (showLoading) setLoading(false);
    }
  }
  useEffect(() => {
    const initialLoad = window.setTimeout(() => void loadTickets(), 0);
    const interval = window.setInterval(() => void loadTickets(false), 15000);
    return () => {
      window.clearTimeout(initialLoad);
      window.clearInterval(interval);
      if (audioContextRef.current) void audioContextRef.current.close();
    };
  }, []);

  async function toggleSoundNotifications() {
    if (soundEnabledRef.current) {
      soundEnabledRef.current = false;
      setSoundEnabled(false);
      if (audioContextRef.current) {
        void audioContextRef.current.close();
        audioContextRef.current = null;
      }
      return;
    }

    try {
      const audioContext = audioContextRef.current || new AudioContext();
      audioContextRef.current = audioContext;
      await audioContext.resume();
      playNotificationTone(audioContext);
      soundEnabledRef.current = true;
      setSoundEnabled(true);
      setNotice("Notifikasi suara aktif. Nada uji telah diputar.");
    } catch (soundError) {
      console.error("Unable to enable support notification sound:", soundError);
      setError("Notifikasi suara tidak dapat diaktifkan di browser ini.");
    }
  }

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

  const SoundIcon = soundEnabled ? Bell : BellOff;
  return <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6"><header className="flex flex-wrap items-center justify-between gap-4"><div><Link href="/admin" className="mb-3 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Kembali ke admin</Link><p className="text-sm font-semibold text-primary">UsahaBit · Admin</p><h1 className="mt-1 text-2xl font-bold sm:text-3xl">Inbox Support</h1><p className="mt-1 text-sm text-muted-foreground">Tiket Business dan Pro muncul lebih dulu di antrean.</p></div><div className="flex gap-2"><Button type="button" variant="outline" onClick={() => void toggleSoundNotifications()} aria-pressed={soundEnabled}><SoundIcon className="mr-2 h-4 w-4" />{soundEnabled ? "Matikan suara" : "Aktifkan suara"}</Button><Button variant="outline" onClick={() => void loadTickets()} disabled={loading}><RefreshCw className="mr-2 h-4 w-4" />Muat ulang</Button></div></header>
    {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}{notice && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700">{notice}</p>}
    {loading ? <p className="py-12 text-center text-sm text-muted-foreground">Memuat tiket…</p> : tickets.length ? <div className="space-y-4">{tickets.map((ticket) => <article key={ticket.id} className="space-y-4 rounded-2xl border bg-card p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs font-semibold uppercase tracking-wide text-primary">{priorities[ticket.priority] || ticket.priority}</p><h2 className="mt-1 text-lg font-semibold">{ticket.subject}</h2><p className="text-sm text-muted-foreground">{ticket.email} · {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(ticket.created_at))}</p></div><span className="rounded-full bg-muted px-3 py-1 text-xs">{statuses[ticket.status] || ticket.status}</span></div><p className="whitespace-pre-wrap rounded-xl bg-muted/40 p-4 text-sm leading-6">{ticket.message}</p><div className="grid gap-3 sm:grid-cols-[200px_1fr]"><select aria-label="Status tiket" value={selectedStatuses[ticket.id] || ticket.status} onChange={(event) => setSelectedStatuses((current) => ({ ...current, [ticket.id]: event.target.value }))} className="h-10 rounded-lg border bg-background px-3 text-sm"><option value="open">Diterima</option><option value="in_progress">Sedang ditangani</option><option value="answered">Dibalas</option><option value="closed">Selesai</option></select><textarea aria-label="Balasan untuk pengguna" rows={3} maxLength={5000} value={replies[ticket.id] || ""} onChange={(event) => setReplies((current) => ({ ...current, [ticket.id]: event.target.value }))} placeholder="Tulis balasan untuk pengguna…" className="rounded-lg border bg-background px-3 py-2 text-sm" /></div><Button size="sm" disabled={savingId === ticket.id} onClick={() => void updateTicket(ticket)}><Send className="mr-2 h-4 w-4" />{savingId === ticket.id ? "Menyimpan…" : "Simpan balasan & status"}</Button></article>)}</div> : <div className="rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground">Belum ada tiket support.</div>}
  </main>;
}
