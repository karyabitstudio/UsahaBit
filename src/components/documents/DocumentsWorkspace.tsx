"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Check, FileText, Lock, Printer, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

type TemplateId = "quotation" | "work_order" | "receipt" | "task_letter" | "completion_report" | "payment_notice";
type DocumentRow = { id: string; template: TemplateId; title: string; recipient: string; body: string; amount: number | null; created_at: string };
type LetterTemplate = { id: TemplateId; label: string; premium?: boolean };

const templates: LetterTemplate[] = [
  { id: "quotation", label: "Surat Penawaran" },
  { id: "work_order", label: "Surat Perintah Kerja" },
  { id: "receipt", label: "Kwitansi" },
  { id: "task_letter", label: "Surat Tugas", premium: true },
  { id: "completion_report", label: "Berita Acara", premium: true },
  { id: "payment_notice", label: "Surat Tagihan", premium: true },
];

function formatMoney(value: number | null) {
  if (value === null) return "";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(value);
}

export function DocumentsWorkspace({ profile, canUseAllTemplates }: { profile: any; canUseAllTemplates: boolean }) {
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [used, setUsed] = useState(0);
  const [limit, setLimit] = useState<number | null>(5);
  const [template, setTemplate] = useState<TemplateId>("quotation");
  const [title, setTitle] = useState("");
  const [recipient, setRecipient] = useState("");
  const [body, setBody] = useState("");
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [preview, setPreview] = useState<DocumentRow | null>(null);

  async function loadDocuments() {
    setLoading(true);
    try {
      const response = await fetch("/api/dashboard/documents", { cache: "no-store" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Surat gagal dimuat.");
      setDocuments(result.documents);
      setUsed(result.used);
      setLimit(result.limit);
      setPreview((current) => current || result.documents[0] || null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Surat gagal dimuat.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadDocuments(); }, []);

  const selectedTemplate = templates.find((item) => item.id === template) || templates[0];

  async function saveDocument(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const response = await fetch("/api/dashboard/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template, title, recipient, body, amount }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Surat gagal disimpan.");
      setDocuments((current) => [result.document, ...current]);
      setPreview(result.document);
      setUsed(result.used);
      setMessage("Surat tersimpan. Gunakan tombol cetak untuk menyimpan sebagai PDF.");
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Surat gagal disimpan.");
    } finally {
      setSaving(false);
    }
  }

  const limitReached = limit !== null && used >= limit;

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,.9fr)]">
      <section className="space-y-5 rounded-2xl border bg-card p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4"><div><h2 className="flex items-center gap-2 text-lg font-semibold"><FileText className="h-5 w-5 text-primary" />Buat surat usaha</h2><p className="mt-1 text-sm text-muted-foreground">Surat disimpan ke akun dan bisa dicetak sebagai PDF.</p></div><span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs">{limit === null ? `${used} dibuat` : `${used}/${limit} bulan ini`}</span></div>
        {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        {message && <p role="status" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-700">{message}</p>}
        <form onSubmit={saveDocument} className="space-y-4">
          <div className="space-y-2"><p className="text-sm font-medium">Pilih template</p><div className="grid grid-cols-2 gap-3 sm:grid-cols-3" role="radiogroup" aria-label="Pilih template surat">{templates.map((item) => {
            const locked = Boolean(item.premium && !canUseAllTemplates);
            const selected = template === item.id;
            return <button key={item.id} type="button" role="radio" aria-checked={selected} aria-disabled={locked} onClick={() => { if (!locked) setTemplate(item.id); }} className={`rounded-xl border p-2 text-left transition ${selected ? "border-primary ring-2 ring-primary/20" : "hover:border-primary/50"} ${locked ? "cursor-not-allowed opacity-75" : ""}`}>
              <span className="mb-2 flex aspect-[1.25/1] items-center justify-center rounded-lg bg-muted p-2"><span className={`flex h-full w-[74%] flex-col rounded border bg-white p-2 shadow-sm ${item.id === "receipt" ? "border-dashed border-slate-400" : item.id === "work_order" ? "border-slate-500" : "border-slate-200"}`}><span className={`mb-2 h-2 rounded-sm ${item.id === "payment_notice" ? "bg-amber-400" : item.id === "work_order" ? "bg-slate-700" : "bg-blue-600"}`} /><span className="mx-auto mb-2 h-1 w-10 rounded bg-slate-500" /><span className="mb-1 h-1 w-full rounded bg-slate-200" /><span className="mb-1 h-1 w-4/5 rounded bg-slate-200" /><span className="mt-auto h-1 w-8 self-end rounded bg-slate-400" /></span></span>
              <span className="flex items-center justify-between gap-1 text-xs font-semibold"><span>{item.label}</span>{locked ? <Lock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : selected ? <Check className="h-3.5 w-3.5 shrink-0 text-primary" /> : null}</span>
              {locked && <span className="mt-1 block text-[10px] text-muted-foreground">Pro / Business</span>}
            </button>;
          })}</div></div>
          <div className="rounded-xl border bg-muted/30 p-3"><p className="mb-2 text-xs font-semibold text-muted-foreground">Pratinjau template terpilih</p><article className={`min-h-36 rounded-lg border bg-white p-4 text-slate-900 shadow-sm ${template === "receipt" ? "border-dashed" : ""}`}><div className={`mb-3 pb-2 text-center ${template === "work_order" ? "border-b-2 border-slate-700" : "border-b border-slate-200"}`}><p className="text-[9px] font-semibold uppercase tracking-[.15em] text-slate-500">{profile?.business_name || "Nama Usaha"}</p><p className="mt-1 text-xs font-bold">{selectedTemplate.label}</p></div><p className="text-[10px] font-semibold">{title || "Judul dokumen"}</p><p className="mt-1 text-[9px] text-slate-500">Kepada: {recipient || "Nama penerima"}</p><p className="mt-3 line-clamp-3 whitespace-pre-wrap text-[9px] leading-4 text-slate-600">{body || "Isi surat akan tampil di bagian ini. Lengkapi kolom di samping untuk melihat pratinjau isi dokumen."}</p>{(template === "receipt" || template === "payment_notice") && <p className="mt-3 border-t pt-2 text-right text-[10px] font-bold">{amount ? formatMoney(Number(amount)) : "Rp 0"}</p>}</article></div>
          {!canUseAllTemplates && <p className="-mt-2 text-xs text-muted-foreground">Tiga template tambahan tersedia di Pro dan Business. <Link href="/pricing" className="font-semibold text-primary hover:underline">Lihat paket</Link></p>}
          <label className="block space-y-2 text-sm font-medium">Judul / nomor surat<input required maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Contoh: Penawaran desain logo" className="h-10 w-full rounded-lg border bg-background px-3 font-normal" /></label>
          <label className="block space-y-2 text-sm font-medium">Penerima<input maxLength={160} value={recipient} onChange={(event) => setRecipient(event.target.value)} placeholder="Nama klien atau perusahaan" className="h-10 w-full rounded-lg border bg-background px-3 font-normal" /></label>
          <label className="block space-y-2 text-sm font-medium">Isi surat<textarea required maxLength={10000} rows={6} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Tuliskan isi, rincian pekerjaan, nominal, dan ketentuan..." className="w-full rounded-lg border bg-background px-3 py-3 font-normal" /></label>
          {(template === "receipt" || template === "payment_notice") && <label className="block space-y-2 text-sm font-medium">Nominal (Rp)<input type="number" min="0" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="Contoh: 1500000" className="h-10 w-full rounded-lg border bg-background px-3 font-normal" /></label>}
          <Button type="submit" disabled={saving || limitReached}><Save className="mr-2 h-4 w-4" />{saving ? "Menyimpan…" : "Simpan surat"}</Button>
          {limitReached && <p className="text-sm text-destructive">Batas surat gratis bulan ini habis. <Link href="/pricing" className="font-semibold underline">Lihat paket</Link></p>}
        </form>
      </section>

      <div className="space-y-6">
        <section className="rounded-2xl border bg-card p-4 sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-semibold">Pratinjau surat</h2><Button type="button" size="sm" variant="outline" disabled={!preview} onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Cetak / simpan PDF</Button></div>
          {preview ? <article data-print-root className="rounded-lg border bg-white p-7 text-slate-900 sm:p-9"><p className="text-center text-xs font-semibold uppercase tracking-[.2em] text-slate-500">{profile?.business_name || "Nama Usaha"}</p><h3 className="mt-6 text-center text-xl font-bold">{templates.find((item) => item.id === preview.template)?.label || selectedTemplate.label}</h3><p className="mt-2 text-center text-sm text-slate-500">{preview.title}</p><div className="my-6 h-px bg-slate-200" />{preview.recipient && <p className="mb-4 text-sm">Kepada: {preview.recipient}</p>}<p className="whitespace-pre-wrap text-sm leading-7">{preview.body}</p>{preview.amount !== null && <p className="mt-5 font-semibold">Nominal: {formatMoney(preview.amount)}</p>}<p className="mt-12 text-right text-sm text-slate-600">{profile?.business_name || profile?.full_name || "Hormat kami"}</p></article> : <div className="rounded-xl border border-dashed p-10 text-center text-sm text-muted-foreground">Simpan surat untuk melihat pratinjau dan mencetaknya.</div>}
        </section>
        <section className="space-y-3 rounded-2xl border bg-card p-4 sm:p-5"><div><h2 className="font-semibold">Surat tersimpan</h2><p className="text-xs text-muted-foreground">Pilih surat untuk melihat atau mencetak ulang.</p></div>{loading ? <p className="py-4 text-sm text-muted-foreground">Memuat surat…</p> : documents.length ? documents.map((item) => <button key={item.id} type="button" onClick={() => setPreview(item)} className={`flex w-full items-center justify-between gap-3 rounded-lg border p-3 text-left text-sm transition hover:border-primary/50 ${preview?.id === item.id ? "border-primary/50 bg-primary/5" : ""}`}><span className="min-w-0"><span className="block truncate font-medium">{item.title}</span><span className="text-xs text-muted-foreground">{templates.find((option) => option.id === item.template)?.label} · {new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(item.created_at))}</span></span></button>) : <p className="py-4 text-sm text-muted-foreground">Belum ada surat tersimpan.</p>}</section>
        {!canUseAllTemplates && <Link href="/pricing" className="flex items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 p-4 text-sm text-muted-foreground"><Lock className="h-4 w-4 shrink-0 text-primary" />Paket Pro membuka semua template dan batas surat yang lebih besar.</Link>}
      </div>
    </div>
  );
}
