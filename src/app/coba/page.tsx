"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Check, FileText, Printer, Plus, Trash2, MessageCircle } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { buttonVariants } from "@/components/ui/button";
import { SiteFooter } from "@/components/SiteFooter";

const FREE_INVOICE_LIMIT = 3;
const STORAGE_PREFIX = "usahabit:free-invoices:";

type Invoice = {
  number: string;
  business: string;
  businessPhone: string;
  businessAddress: string;
  customer: string;
  email: string;
  phone: string;
  issueDate: string;
  dueDate: string;
  items: { description: string; quantity: number; unitPrice: number }[];
  subtotal: number;
  tax: number;
  total: number;
  notes: string;
  date: string;
};

type InvoiceItem = { description: string; quantity: number; unitPrice: number };

function getPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function subscribeToUsage(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener("usahabit:usage-change", onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener("usahabit:usage-change", onChange);
  };
}

function getUsageSnapshot() {
  if (typeof window === "undefined") return null;
  const used = Number(window.localStorage.getItem(`${STORAGE_PREFIX}${getPeriod()}`) || 0);
  return Number.isFinite(used) ? used : 0;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function TryInvoicePage() {
  const usageCount = useSyncExternalStore(subscribeToUsage, getUsageSnapshot, () => null);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [business, setBusiness] = useState("");
  const [businessPhone, setBusinessPhone] = useState("");
  const [businessAddress, setBusinessAddress] = useState("");
  const [customer, setCustomer] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [taxRate, setTaxRate] = useState("0");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([{ description: "", quantity: 1, unitPrice: 0 }]);

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const tax = Math.round(subtotal * (Number(taxRate) || 0) / 100);
  const total = subtotal + tax;

  useEffect(() => {
    // Set the date after hydration so it reflects the visitor's local day.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIssueDate(new Date().toISOString().slice(0, 10));
  }, []);

  function updateItem(index: number, field: keyof InvoiceItem, value: string | number) {
    setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, [field]: value } : item));
  }

  const limitReached = usageCount !== null && usageCount >= FREE_INVOICE_LIMIT;

  function createInvoice(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (usageCount === null || limitReached) return;

    const nextUsage = usageCount + 1;
    const period = getPeriod();
    const number = `UB-${period.replace("-", "")}-${String(nextUsage).padStart(3, "0")}`;
    const newInvoice: Invoice = {
      number,
      business: business.trim(),
      businessPhone: businessPhone.trim(),
      businessAddress: businessAddress.trim(),
      customer: customer.trim(),
      email: email.trim(),
      phone: phone.trim(),
      issueDate,
      dueDate,
      items: items.map((item) => ({ ...item, description: item.description.trim() })),
      subtotal,
      tax,
      total,
      notes: notes.trim(),
      date: new Date().toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    };

    window.localStorage.setItem(`${STORAGE_PREFIX}${period}`, String(nextUsage));
    const savedInvoices = JSON.parse(window.localStorage.getItem("usahabit:demo:invoices") || "[]") as Array<Invoice & { status?: string }>;
    window.localStorage.setItem(
      "usahabit:demo:invoices",
      JSON.stringify([{ ...newInvoice, description: newInvoice.items.map((item) => item.description).join(", "), amount: newInvoice.total, status: "Belum dibayar" }, ...savedInvoices]),
    );
    window.dispatchEvent(new Event("usahabit:usage-change"));
    setInvoice(newInvoice);
  }

  return (
    <main className="min-h-screen px-4 py-5 sm:px-8 sm:py-8">
      <header className="no-print mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" aria-label="UsahaBit - Beranda"><BrandLogo size={40} /></Link>
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Kembali ke beranda
        </Link>
      </header>

      <div className="mx-auto mt-10 grid max-w-6xl items-start gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="no-print">
          <p className="text-sm font-semibold uppercase tracking-[.16em] text-primary">Mulai buat invoice</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">Buat invoice pertamamu</h1>
          <p className="mt-4 leading-7 text-muted-foreground">
            Isi detail tagihan, buat invoice, lalu simpan sebagai PDF. Gratis sampai {FREE_INVOICE_LIMIT} invoice per bulan di browser ini.
          </p>

          <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">
            Data percobaan ini tersimpan di browser dan tidak otomatis masuk ke database. Untuk membuat serta mengelola data permanen di dashboard, <Link href="/login" className="font-semibold text-primary hover:underline">masuk terlebih dahulu</Link>. Belum punya akun? <Link href="/register" className="font-semibold text-primary hover:underline">Daftar di sini</Link>.
          </div>

          <div className="mt-6 rounded-xl border border-border bg-card/70 p-4">
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-muted-foreground">Jatah gratis bulan ini</span>
              <span className="font-semibold">{usageCount === null ? "Memuat…" : `${Math.max(0, FREE_INVOICE_LIMIT - usageCount)} dari ${FREE_INVOICE_LIMIT} tersisa`}</span>
            </div>
            <div className="mt-3 flex gap-1.5" aria-label={`${usageCount ?? 0} dari ${FREE_INVOICE_LIMIT} invoice digunakan`}>
              {Array.from({ length: FREE_INVOICE_LIMIT }, (_, index) => (
                <span key={index} className={`h-1.5 flex-1 rounded-full ${index < (usageCount ?? 0) ? "bg-primary" : "bg-muted"}`} />
              ))}
            </div>
          </div>

          {limitReached ? (
            <div className="mt-6 rounded-2xl border border-primary/30 bg-primary/10 p-6">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary"><Check className="h-5 w-5" /></div>
              <h2 className="mt-4 text-xl font-semibold">Jatah gratis bulan ini habis</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">Kamu sudah membuat {FREE_INVOICE_LIMIT} invoice gratis. Lihat paket UsahaBit untuk melanjutkan.</p>
              <Link href="/pricing" className={buttonVariants({ className: "mt-5 rounded-full px-5" })}>Lihat paket <ArrowRight className="ml-2 h-4 w-4" /></Link>
            </div>
          ) : (
            <form onSubmit={createInvoice} className="mt-6 space-y-6 rounded-2xl border border-border bg-card/70 p-5 sm:p-6">
              <div>
                <h2 className="text-sm font-semibold">Informasi usaha</h2>
                <div className="mt-3 space-y-3">
                  <input required maxLength={80} value={business} onChange={(event) => setBusiness(event.target.value)} placeholder="Nama usaha" aria-label="Nama usaha" className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input value={businessPhone} onChange={(event) => setBusinessPhone(event.target.value)} placeholder="Telepon / WhatsApp usaha" aria-label="Telepon usaha" className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
                    <input value={businessAddress} onChange={(event) => setBusinessAddress(event.target.value)} placeholder="Alamat usaha" aria-label="Alamat usaha" className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-sm font-semibold">Ditagihkan kepada</h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <input required maxLength={80} value={customer} onChange={(event) => setCustomer(event.target.value)} placeholder="Nama klien" aria-label="Nama klien" className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
                  <input type="email" maxLength={120} value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email klien (opsional)" aria-label="Email klien" className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
                  <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="WhatsApp klien (opsional)" aria-label="WhatsApp klien" className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary sm:col-span-2" />
                </div>
              </div>

              <div>
                <h2 className="text-sm font-semibold">Tanggal invoice</h2>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1.5 text-xs text-muted-foreground">Tanggal terbit<input type="date" required value={issueDate} onChange={(event) => setIssueDate(event.target.value)} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground" /></label>
                  <label className="space-y-1.5 text-xs text-muted-foreground">Jatuh tempo<input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground" /></label>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3"><h2 className="text-sm font-semibold">Rincian item / jasa</h2><button type="button" onClick={() => setItems((current) => [...current, { description: "", quantity: 1, unitPrice: 0 }])} className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-border px-3 text-xs font-semibold transition hover:bg-muted"><Plus className="h-3.5 w-3.5" /> Tambah item</button></div>
                <div className="mt-3 space-y-3">
                  {items.map((item, index) => <div key={index} className="rounded-xl border border-border p-3">
                    <div className="flex items-center justify-between"><span className="text-xs font-semibold text-muted-foreground">Item {index + 1}</span>{items.length > 1 && <button type="button" onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label={`Hapus item ${index + 1}`} className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button>}</div>
                    <input required maxLength={160} value={item.description} onChange={(event) => updateItem(index, "description", event.target.value)} placeholder="Deskripsi barang atau jasa" aria-label={`Deskripsi item ${index + 1}`} className="mt-2 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
                    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-[.7fr_1fr_1fr]">
                      <label className="space-y-1 text-xs text-muted-foreground">Qty<input required type="number" min="0.01" step="0.01" value={item.quantity} onChange={(event) => updateItem(index, "quantity", Number(event.target.value))} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground" /></label>
                      <label className="space-y-1 text-xs text-muted-foreground">Harga satuan<input required type="number" min="0" step="1" value={item.unitPrice} onChange={(event) => updateItem(index, "unitPrice", Number(event.target.value))} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground" /></label>
                      <div className="col-span-2 flex items-end justify-between rounded-lg bg-muted/60 px-3 py-2 text-xs sm:col-span-1 sm:block"><span className="text-muted-foreground">Jumlah</span><span className="font-semibold text-foreground sm:mt-1 sm:block">{formatCurrency(item.quantity * item.unitPrice)}</span></div>
                    </div>
                  </div>)}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium">Catatan<textarea rows={3} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Catatan pembayaran atau ucapan terima kasih" className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm font-normal outline-none focus:border-primary" /></label>
                <div className="space-y-3 rounded-xl bg-muted/60 p-4">
                  <label className="flex items-center justify-between gap-3 text-sm">Pajak (%)<input type="number" min="0" max="100" value={taxRate} onChange={(event) => setTaxRate(event.target.value)} className="h-9 w-24 rounded-lg border border-input bg-background px-2 text-right" /></label>
                  <div className="flex justify-between text-sm text-muted-foreground"><span>Subtotal</span><span>{formatCurrency(subtotal)}</span></div>
                  <div className="flex justify-between text-sm text-muted-foreground"><span>Pajak ({taxRate || 0}%)</span><span>{formatCurrency(tax)}</span></div>
                  <div className="flex justify-between border-t border-border pt-3 font-bold"><span>Total</span><span>{formatCurrency(total)}</span></div>
                </div>
              </div>
              <button type="submit" disabled={usageCount === null} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-wait disabled:opacity-60"><FileText className="h-4 w-4" /> Buat invoice</button>
            </form>
          )}
        </section>

        <section aria-label="Pratinjau invoice">
          {invoice ? (
            <article className="invoice-sheet rounded-2xl border border-border bg-white p-6 text-slate-900 shadow-xl sm:p-10">
              <div className="no-print mb-6 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
                <div className="flex items-center gap-2 text-sm font-medium text-emerald-700"><Check className="h-4 w-4" /> Invoice siap dibuat</div>
                <div className="flex flex-wrap gap-2">
                  {invoice.phone && <button type="button" onClick={() => { const target = invoice.phone.replace(/\D/g, "").replace(/^0/, "62"); const message = `Halo ${invoice.customer}, berikut invoice ${invoice.number} dari ${invoice.business} sebesar ${formatCurrency(invoice.total)}. Jatuh tempo: ${invoice.dueDate || "sesuai kesepakatan"}.`; window.open(`https://wa.me/${target}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer"); }} className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium transition hover:bg-slate-100"><MessageCircle className="h-4 w-4" /> Kirim WhatsApp</button>}
                  <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium transition hover:bg-slate-100"><Printer className="h-4 w-4" /> Simpan sebagai PDF</button>
                </div>
              </div>
              <div className="flex items-start justify-between gap-4">
                <div><p className="text-sm font-semibold uppercase tracking-[.16em] text-blue-700">Invoice</p><h2 className="mt-2 text-2xl font-bold">{invoice.business}</h2>{invoice.businessPhone && <p className="mt-1 text-sm text-slate-500">{invoice.businessPhone}</p>}{invoice.businessAddress && <p className="mt-1 text-sm text-slate-500">{invoice.businessAddress}</p>}</div>
                <div className="text-right text-sm"><p className="font-semibold">{invoice.number}</p><p className="mt-1 text-slate-500">Terbit: {invoice.issueDate}</p>{invoice.dueDate && <p className="mt-1 text-slate-500">Jatuh tempo: {invoice.dueDate}</p>}</div>
              </div>
              <div className="my-8 h-px bg-slate-200" />
              <div className="grid gap-6 sm:grid-cols-2">
                <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Ditagihkan kepada</p><p className="mt-2 font-semibold">{invoice.customer}</p>{invoice.email && <p className="mt-1 text-sm text-slate-500">{invoice.email}</p>}{invoice.phone && <p className="mt-1 text-sm text-slate-500">{invoice.phone}</p>}</div>
                <div className="sm:text-right"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Tanggal invoice</p><p className="mt-2 font-medium">{invoice.date}</p></div>
              </div>
              <div className="mt-10 overflow-hidden rounded-xl border border-slate-200">
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 bg-slate-50 px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500"><span>Deskripsi</span><span className="text-right">Qty</span><span className="text-right">Harga</span><span className="text-right">Jumlah</span></div>
                {invoice.items.map((item, index) => <div key={`${item.description}-${index}`} className="grid grid-cols-[1fr_auto_auto_auto] gap-3 border-t border-slate-100 px-4 py-4 text-sm"><span>{item.description}</span><span className="text-right">{item.quantity}</span><span className="text-right">{formatCurrency(item.unitPrice)}</span><span className="text-right font-medium">{formatCurrency(item.quantity * item.unitPrice)}</span></div>)}
              </div>
              <div className="mt-6 flex justify-end"><div className="w-full max-w-xs space-y-2 border-t border-slate-200 pt-4 text-sm"><div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{formatCurrency(invoice.subtotal)}</span></div><div className="flex justify-between"><span className="text-slate-500">Pajak</span><span>{formatCurrency(invoice.tax)}</span></div><div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-bold"><span>Total</span><span>{formatCurrency(invoice.total)}</span></div></div></div>
              {invoice.notes && <div className="mt-8 rounded-xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Catatan</p><p className="mt-2 whitespace-pre-wrap text-sm">{invoice.notes}</p></div>}
              <p className="mt-12 border-t border-slate-200 pt-4 text-center text-xs text-slate-400">Terima kasih telah mempercayakan pekerjaan ini kepada {invoice.business}.</p>
            </article>
          ) : (
            <div className="invoice-sheet flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><FileText className="h-7 w-7" /></div>
              <h2 className="mt-5 text-lg font-semibold">Pratinjau invoice muncul di sini</h2>
              <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground">Isi detail tagihan, lalu cetak invoice atau simpan sebagai PDF.</p>
            </div>
          )}
        </section>
      </div>
      <div className="no-print mx-auto mt-12 max-w-6xl"><SiteFooter /></div>
    </main>
  );
}
