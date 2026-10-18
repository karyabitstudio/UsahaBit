"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Client = { id: string; name: string; email: string | null; phone: string | null; address: string | null; notes: string | null };

export function ClientListWorkspace({ clients: initialClients }: { clients: Client[] }) {
  const [clients, setClients] = useState(initialClients);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function deleteClient(client: Client) {
    if (!window.confirm(`Hapus klien ${client.name}? Invoice yang terkait akan tetap tersimpan tanpa nama klien.`)) return;
    setError(null);
    setMessage(null);
    const response = await fetch(`/api/dashboard/clients/${client.id}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) { setError(result.error || "Klien gagal dihapus."); return; }
    setClients((current) => current.filter((item) => item.id !== client.id));
    setMessage("Klien berhasil dihapus.");
  }

  return <section className="space-y-3 rounded-2xl border bg-card p-5 sm:p-6">
    {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
    {message && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700">{message}</p>}
    {clients.length ? clients.map((client) => <article key={client.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"><div className="min-w-0"><p className="font-medium">{client.name}</p><p className="mt-1 truncate text-sm text-muted-foreground">{[client.email, client.phone].filter(Boolean).join(" · ") || client.address || "Belum ada detail kontak"}</p></div><div className="flex gap-1"><Link href={`/dashboard/clients/${client.id}/edit`} className="inline-flex h-9 items-center rounded-md px-3 text-sm hover:bg-muted"><Pencil className="mr-2 h-4 w-4" />Edit</Link><Button type="button" variant="ghost" size="sm" onClick={() => void deleteClient(client)}><Trash2 className="mr-2 h-4 w-4 text-destructive" />Hapus</Button></div></article>) : <p className="py-10 text-center text-sm text-muted-foreground">Belum ada klien. Tambahkan klien untuk mulai membuat invoice.</p>}
  </section>;
}
