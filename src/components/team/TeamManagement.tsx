"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MailPlus, ShieldCheck, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

type Member = { id: string; invited_email: string; status: "pending" | "active"; created_at: string };

export function TeamManagement() {
  const [members, setMembers] = useState<Member[]>([]);
  const [email, setEmail] = useState("");
  const [seatsUsed, setSeatsUsed] = useState(1);
  const [canManage, setCanManage] = useState(false);
  const [isOwner, setIsOwner] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function loadTeam() {
    setLoading(true);
    try {
      const response = await fetch("/api/dashboard/team", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Data tim gagal dimuat.");
      setMembers(result.members);
      setSeatsUsed(result.seatsUsed);
      setCanManage(result.canManage);
      setIsOwner(result.isOwner);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Data tim gagal dimuat.");
    } finally { setLoading(false); }
  }

  useEffect(() => { void loadTeam(); }, []);

  async function invite(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(null); setMessage(null);
    try {
      const response = await fetch("/api/dashboard/team", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Undangan gagal dikirim.");
      setMessage(result.member.status === "active" ? "Anggota berhasil ditambahkan." : "Undangan dikirim lewat email. Minta anggota membuka tautan undangan untuk bergabung.");
      setEmail("");
      await loadTeam();
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : "Undangan gagal dikirim.");
    } finally { setSaving(false); }
  }

  async function remove(member: Member) {
    if (!window.confirm(`Keluarkan ${member.invited_email} dari workspace?`)) return;
    const response = await fetch("/api/dashboard/team", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ memberId: member.id }) });
    const result = await response.json();
    if (!response.ok) { setError(result.error || "Anggota gagal dikeluarkan."); return; }
    await loadTeam();
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header><p className="text-sm font-semibold text-primary">Workspace</p><h1 className="mt-1 flex items-center gap-2 text-2xl font-bold sm:text-3xl"><Users className="h-6 w-6" />Anggota tim</h1><p className="mt-1 text-sm text-muted-foreground">Bagikan workspace dengan anggota untuk bekerja bersama pada invoice, klien, produk, dan surat.</p></header>
      {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {message && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700">{message}</p>}
      {loading ? <p className="py-10 text-center text-sm text-muted-foreground">Memuat anggota tim…</p> : !canManage ? <section className="rounded-2xl border bg-card p-6"><h2 className="font-semibold">{isOwner ? "Undang tim sampai lima orang" : "Workspace tim"}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{isOwner ? "Fitur multi-user tersedia di Business. Upgrade untuk berbagi workspace dengan anggota tim." : "Kamu bergabung sebagai anggota. Pemilik workspace mengatur undangan dan paket."}</p>{isOwner && <Link href="/pricing" className="mt-4 inline-flex font-semibold text-primary hover:underline">Lihat paket Business</Link>}</section> : <>
        <section className="space-y-4 rounded-2xl border bg-card p-5 sm:p-6"><div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold">Kapasitas workspace</h2><p className="text-sm text-muted-foreground">Pemilik dan anggota aktif atau menunggu undangan.</p></div><span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">{seatsUsed} / 5</span></div><div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, seatsUsed * 20)}%` }} /></div></section>
        <section className="space-y-4 rounded-2xl border bg-card p-5 sm:p-6"><h2 className="font-semibold">Undang anggota</h2><form onSubmit={invite} className="flex flex-col gap-3 sm:flex-row"><input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email@perusahaan.com" className="h-10 min-w-0 flex-1 rounded-lg border bg-background px-3 text-sm" /><Button type="submit" disabled={saving || seatsUsed >= 5}><MailPlus className="mr-2 h-4 w-4" />{saving ? "Mengirim…" : "Kirim undangan"}</Button></form><p className="text-xs text-muted-foreground">Anggota akan mendapat akses ke data workspace ini. Undangan baru dapat memerlukan SMTP Supabase.</p></section>
        <section className="space-y-3 rounded-2xl border bg-card p-5 sm:p-6"><h2 className="font-semibold">Anggota ({members.length + 1} dari 5)</h2><article className="flex items-center gap-3 rounded-xl border p-4"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary"><ShieldCheck className="h-5 w-5" /></span><div><p className="font-medium">Pemilik workspace</p><p className="text-xs text-muted-foreground">Paket Business</p></div></article>{members.map((member) => <article key={member.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"><div><p className="font-medium">{member.invited_email}</p><p className="text-xs text-muted-foreground">{member.status === "active" ? "Aktif" : "Menunggu undangan"}</p></div><Button type="button" variant="ghost" size="icon" aria-label={`Keluarkan ${member.invited_email}`} onClick={() => void remove(member)}><Trash2 className="h-4 w-4 text-destructive" /></Button></article>)}</section>
      </>}
    </div>
  );
}
