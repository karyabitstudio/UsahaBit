"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type Invoice = { id: string; invoice_number: string; issue_date: string; due_date: string | null; status: string; total: number; clients: { name: string } | null };
const statuses: Record<string, string> = { draft: "Draft", sent: "Terkirim", paid: "Lunas", overdue: "Terlambat", cancelled: "Dibatalkan" };
const money = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });

export function InvoiceListWorkspace({ invoices: initial }: { invoices: Invoice[] }) {
  const [invoices, setInvoices] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function deleteInvoice(invoice: Invoice) {
    if (!window.confirm(`Hapus invoice ${invoice.invoice_number}? Tindakan ini tidak dapat dibatalkan.`)) return;
    setError(null); setMessage(null);
    const response = await fetch(`/api/dashboard/invoices/${invoice.id}`, { method: "DELETE" });
    const result = await response.json();
    if (!response.ok) { setError(result.error || "Invoice gagal dihapus."); return; }
    setInvoices((current) => current.filter((item) => item.id !== invoice.id));
    setMessage("Invoice berhasil dihapus.");
  }

  return <section className="space-y-3 rounded-2xl border bg-card p-5 sm:p-6">
    {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
    {message && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700">{message}</p>}
    {invoices.length ? invoices.map((invoice) => <article key={invoice.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4"><Link href={`/dashboard/invoices/${invoice.id}`} className="min-w-0 flex-1"><p className="truncate font-medium">{invoice.invoice_number}</p><p className="mt-1 text-sm text-muted-foreground">{invoice.clients?.name || "Tanpa klien"} · {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(invoice.issue_date))} · {statuses[invoice.status] || invoice.status}</p><p className="mt-1 text-sm font-semibold">{money.format(Number(invoice.total))}</p></Link><div className="flex gap-1"><Link href={`/dashboard/invoices/${invoice.id}/edit`} className="inline-flex h-9 items-center rounded-md px-3 text-sm hover:bg-muted"><Pencil className="mr-2 h-4 w-4" />Edit</Link><Button type="button" variant="ghost" size="sm" onClick={() => void deleteInvoice(invoice)}><Trash2 className="mr-2 h-4 w-4 text-destructive" />Hapus</Button></div></article>) : <p className="py-10 text-center text-sm text-muted-foreground">Belum ada invoice. Buat invoice pertama untuk mulai mencatat tagihan.</p>}
  </section>;
}
