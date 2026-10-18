"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BriefcaseBusiness,
  Check,
  ClipboardList,
  FilePlus2,
  FileText,
  History,
  MessageCircle,
  Package,
  Plus,
  Printer,
  Trash2,
  Users,
} from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { SiteFooter } from "@/components/SiteFooter";

type Tool = "overview" | "clients" | "products" | "documents" | "business" | "history" | "whatsapp";
type ServiceId = Exclude<Tool, "overview">;
type SavedItem = { id: string; name: string; detail: string; price?: number };
type SavedInvoice = {
  number: string;
  business: string;
  customer: string;
  email?: string;
  description: string;
  amount: number;
  date: string;
  status?: string;
};

const KEYS = {
  clients: "usahabit:demo:clients",
  products: "usahabit:demo:products",
  business: "usahabit:demo:business",
  invoices: "usahabit:demo:invoices",
};
const FREE_SERVICE_LIMIT = 3;
const FREE_INVOICE_LIMIT = 3;

function invoiceUsageKey() {
  const now = new Date();
  return `usahabit:free-invoices:${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function usageKey(service: ServiceId) {
  const now = new Date();
  const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  return `usahabit:free-usage:${period}:${service}`;
}

function readUsage(service: ServiceId) {
  const value = Number(localStorage.getItem(usageKey(service)) || 0);
  return Number.isFinite(value) ? value : 0;
}

const serviceCards: { id: ServiceId; title: string; description: string; icon: typeof Users }[] = [
  { id: "clients", title: "Kelola klien", description: "Catat pelanggan dan detail kontaknya.", icon: Users },
  { id: "products", title: "Katalog produk", description: "Simpan layanan atau produk beserta harganya.", icon: Package },
  { id: "documents", title: "Surat usaha", description: "Susun surat penawaran, kwitansi, dan SPK.", icon: FilePlus2 },
  { id: "business", title: "Profil & branding", description: "Atur nama usaha, kontak, alamat, dan warna.", icon: BriefcaseBusiness },
  { id: "history", title: "Riwayat & status", description: "Lihat invoice percobaan dan tandai pembayarannya.", icon: History },
  { id: "whatsapp", title: "Kirim WhatsApp", description: "Siapkan pesan tagihan untuk pelanggan.", icon: MessageCircle },
];

function readItems(key: string): SavedItem[] {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function readInvoices(): SavedInvoice[] {
  try {
    const value = JSON.parse(localStorage.getItem(KEYS.invoices) || "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(amount || 0);
}

export function LayananWorkspace() {
  const [tool, setTool] = useState<Tool>("overview");
  const [clients, setClients] = useState<SavedItem[]>([]);
  const [products, setProducts] = useState<SavedItem[]>([]);
  const [invoices, setInvoices] = useState<SavedInvoice[]>([]);
  const [invoiceUsage, setInvoiceUsage] = useState(0);
  const [usage, setUsage] = useState<Partial<Record<ServiceId, number>>>({});
  const [name, setName] = useState("");
  const [detail, setDetail] = useState("");
  const [price, setPrice] = useState("");
  const [business, setBusiness] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [brandColor, setBrandColor] = useState("#2563eb");
  const [docType, setDocType] = useState("Surat Penawaran");
  const [docTitle, setDocTitle] = useState("");
  const [docBody, setDocBody] = useState("");
  const [waPhone, setWaPhone] = useState("");
  const [waMessage, setWaMessage] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    // Browser storage is only available after hydration; initialize the demo workspace here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setClients(readItems(KEYS.clients));
    setProducts(readItems(KEYS.products));
    setInvoices(readInvoices());
    setInvoiceUsage(Number(localStorage.getItem(invoiceUsageKey()) || 0));
    setUsage(Object.fromEntries(serviceCards.map((service) => [service.id, readUsage(service.id)])) as Record<ServiceId, number>);
    try {
      const saved = JSON.parse(localStorage.getItem(KEYS.business) || "{}");
      setBusiness(saved.business || "");
      setPhone(saved.phone || "");
      setAddress(saved.address || "");
      setBrandColor(saved.brandColor || "#2563eb");
    } catch {
      // Start with an empty business profile if saved trial data is malformed.
    }
  }, []);

  function consumeUsage(service: ServiceId) {
    const used = readUsage(service);
    if (used >= FREE_SERVICE_LIMIT) {
      setNotice(`Jatah gratis ${serviceCards.find((item) => item.id === service)?.title.toLowerCase()} bulan ini sudah habis.`);
      return false;
    }
    const nextUsage = used + 1;
    localStorage.setItem(usageKey(service), String(nextUsage));
    setUsage((current) => ({ ...current, [service]: nextUsage }));
    setNotice("");
    return true;
  }

  function quotaNotice(service: ServiceId) {
    if ((usage[service] || 0) < FREE_SERVICE_LIMIT) {
      return <p className="mt-4 text-xs text-muted-foreground">Jatah gratis bulan ini: {FREE_SERVICE_LIMIT - (usage[service] || 0)} dari {FREE_SERVICE_LIMIT} penggunaan tersisa.</p>;
    }
    return <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-primary/25 bg-primary/5 p-4 text-sm"><span>Jatah gratis layanan ini bulan ini sudah habis.</span><Link href="/pricing" className="font-semibold text-primary hover:underline">Lihat paket <ArrowRight className="ml-1 inline h-4 w-4" /></Link></div>;
  }

  function addItem(event: FormEvent<HTMLFormElement>, type: "clients" | "products") {
    event.preventDefault();
    if (!consumeUsage(type)) return;
    const key = type === "clients" ? KEYS.clients : KEYS.products;
    const items = readItems(key);
    const item: SavedItem = { id: crypto.randomUUID(), name: name.trim(), detail: detail.trim() };
    if (type === "products") item.price = Number(price);
    const updated = [item, ...items];
    localStorage.setItem(key, JSON.stringify(updated));
    if (type === "clients") setClients(updated);
    else setProducts(updated);
    setName("");
    setDetail("");
    setPrice("");
    setNotice(type === "clients" ? "Klien berhasil ditambahkan." : "Produk berhasil ditambahkan.");
  }

  function deleteItem(type: "clients" | "products", id: string) {
    const key = type === "clients" ? KEYS.clients : KEYS.products;
    const updated = readItems(key).filter((item) => item.id !== id);
    localStorage.setItem(key, JSON.stringify(updated));
    if (type === "clients") setClients(updated);
    else setProducts(updated);
  }

  function saveBusiness(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!consumeUsage("business")) return;
    localStorage.setItem(KEYS.business, JSON.stringify({ business, phone, address, brandColor }));
    setNotice("Profil usaha tersimpan di browser ini.");
  }

  function setInvoiceStatus(number: string, status: string) {
    if (!consumeUsage("history")) return;
    const updated = readInvoices().map((invoice) => invoice.number === number ? { ...invoice, status } : invoice);
    localStorage.setItem(KEYS.invoices, JSON.stringify(updated));
    setInvoices(updated);
  }

  const activeService = serviceCards.find((service) => service.id === tool);

  return (
    <main className="min-h-screen px-4 py-5 sm:px-8 sm:py-8">
      <header className="mx-auto flex max-w-6xl items-center justify-between">
        <Link href="/" aria-label="UsahaBit - Beranda"><BrandLogo size={40} /></Link>
        <div className="flex items-center gap-4"><Link href="/tutorial" className="text-sm text-muted-foreground transition hover:text-foreground">Tutorial</Link><Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Beranda</Link></div>
      </header>

      <div className="mx-auto mt-9 max-w-6xl">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[.16em] text-primary">UsahaBit · Ruang kerja</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Coba semua layanan</h1>
            <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">Pilih alat yang kamu butuhkan. Data percobaan tersimpan di browser ini.</p>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Data layanan percobaan tersimpan di browser dan tidak otomatis masuk ke database. Untuk membuat serta mengelola data permanen di dashboard, <Link href="/login" className="font-semibold text-primary hover:underline">masuk terlebih dahulu</Link>. Belum punya akun? <Link href="/register" className="font-semibold text-primary hover:underline">Daftar di sini</Link>.</p>
          </div>
          <Link href="/coba" className="inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">Buat invoice <ArrowRight className="h-4 w-4" /></Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
          <aside className="h-fit rounded-2xl border border-border bg-card p-3">
            <button onClick={() => { setTool("overview"); setNotice(""); }} className={`mb-2 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${tool === "overview" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}><ClipboardList className="h-4 w-4" /> Semua layanan</button>
            <nav className="space-y-1">
              {serviceCards.map((service) => <button key={service.id} onClick={() => { setTool(service.id); setNotice(""); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium transition ${tool === service.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}><service.icon className="h-4 w-4" />{service.title}</button>)}
            </nav>
            <Link href="/coba" className="mt-2 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-muted-foreground transition hover:bg-muted"><FileText className="h-4 w-4" /> Buat invoice</Link>
          </aside>

          <section className="min-h-[520px] rounded-2xl border border-border bg-card p-5 sm:p-7">
            {notice && <div role="status" className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700"><Check className="h-4 w-4" />{notice}</div>}

            {tool === "overview" && <>
              <div className="mb-6"><h2 className="text-xl font-semibold">Semua alat usaha</h2><p className="mt-1 text-sm text-muted-foreground">Pilih layanan untuk langsung mencoba.</p></div>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {serviceCards.map((service) => <button key={service.id} onClick={() => setTool(service.id)} className="group rounded-2xl border border-border p-5 text-left transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/[.03]"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><service.icon className="h-5 w-5" /></span><span className="mt-4 block font-semibold">{service.title}</span><span className="mt-2 block text-sm leading-6 text-muted-foreground">{service.description}</span><span className="mt-3 block text-xs text-muted-foreground">{Math.max(0, FREE_SERVICE_LIMIT - (usage[service.id] || 0))} dari {FREE_SERVICE_LIMIT} gratis tersisa bulan ini</span><span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary">Coba sekarang <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span></button>)}
                <Link href="/coba" className="group rounded-2xl border border-primary/30 bg-primary/[.04] p-5 transition hover:-translate-y-0.5 hover:border-primary"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><FileText className="h-5 w-5" /></span><span className="mt-4 block font-semibold">Buat invoice</span><span className="mt-2 block text-sm leading-6 text-muted-foreground">Buat tagihan dan simpan sebagai PDF.</span><span className="mt-3 block text-xs text-muted-foreground">{Math.max(0, FREE_INVOICE_LIMIT - invoiceUsage)} dari {FREE_INVOICE_LIMIT} gratis tersisa bulan ini</span><span className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary">Coba sekarang <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span></Link>
              </div>
            </>}

            {activeService && <div className="mb-6 flex items-start gap-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><activeService.icon className="h-6 w-6" /></span><div><h2 className="text-xl font-semibold">{activeService.title}</h2><p className="mt-1 text-sm text-muted-foreground">{activeService.description}</p>{quotaNotice(activeService.id)}</div></div>}

            {tool === "clients" && <>
              <form onSubmit={(event) => addItem(event, "clients")} className="grid gap-3 rounded-xl bg-muted/50 p-4 sm:grid-cols-[1fr_1fr_auto]">
                <input required maxLength={80} value={name} onChange={(event) => setName(event.target.value)} placeholder="Nama klien" className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
                <input value={detail} onChange={(event) => setDetail(event.target.value)} placeholder="Email atau nomor WhatsApp" className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
                <button disabled={(usage.clients || 0) >= FREE_SERVICE_LIMIT} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"><Plus className="h-4 w-4" /> Tambah</button>
              </form>
              <div className="mt-5 divide-y divide-border">{clients.length ? clients.map((client) => <div key={client.id} className="flex items-center justify-between gap-3 py-3"><div><p className="font-medium">{client.name}</p><p className="text-sm text-muted-foreground">{client.detail || "Belum ada kontak"}</p></div><button onClick={() => deleteItem("clients", client.id)} aria-label={`Hapus ${client.name}`} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button></div>) : <p className="py-8 text-center text-sm text-muted-foreground">Belum ada klien. Tambahkan klien pertamamu di atas.</p>}</div>
            </>}

            {tool === "products" && <>
              <form onSubmit={(event) => addItem(event, "products")} className="grid gap-3 rounded-xl bg-muted/50 p-4 sm:grid-cols-[1fr_1fr_150px_auto]">
                <input required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} placeholder="Nama produk atau jasa" className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
                <input value={detail} onChange={(event) => setDetail(event.target.value)} placeholder="Deskripsi singkat" className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
                <input required type="number" min="1" value={price} onChange={(event) => setPrice(event.target.value)} placeholder="Harga (Rp)" className="h-10 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:border-primary" />
                <button disabled={(usage.products || 0) >= FREE_SERVICE_LIMIT} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"><Plus className="h-4 w-4" /> Tambah</button>
              </form>
              <div className="mt-5 divide-y divide-border">{products.length ? products.map((product) => <div key={product.id} className="flex items-center justify-between gap-3 py-3"><div><p className="font-medium">{product.name}</p><p className="text-sm text-muted-foreground">{product.detail} {product.price ? `· ${formatCurrency(product.price)}` : ""}</p></div><button onClick={() => deleteItem("products", product.id)} aria-label={`Hapus ${product.name}`} className="rounded-lg p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"><Trash2 className="h-4 w-4" /></button></div>) : <p className="py-8 text-center text-sm text-muted-foreground">Katalog masih kosong. Tambahkan produk atau jasamu.</p>}</div>
            </>}

            {tool === "business" && <form onSubmit={saveBusiness} className="max-w-xl space-y-4">
              {[{ label: "Nama usaha", value: business, set: setBusiness, placeholder: "Contoh: Kedai Kopi Senja" }, { label: "Nomor WhatsApp", value: phone, set: setPhone, placeholder: "+62 812 3456 7890" }, { label: "Alamat usaha", value: address, set: setAddress, placeholder: "Alamat yang tampil di dokumen" }].map((field) => <label key={field.label} className="block space-y-2 text-sm font-medium">{field.label}<input value={field.value} onChange={(event) => field.set(event.target.value)} placeholder={field.placeholder} className="h-11 w-full rounded-lg border border-input bg-background px-3 font-normal outline-none focus:border-primary" /></label>)}
              <label className="block space-y-2 text-sm font-medium">Warna identitas<div className="flex h-11 items-center gap-3 rounded-lg border border-input bg-background px-3"><input type="color" value={brandColor} onChange={(event) => setBrandColor(event.target.value)} className="h-8 w-10 cursor-pointer border-0 bg-transparent" /><span className="text-sm font-normal text-muted-foreground">{brandColor}</span></div></label>
              <button disabled={(usage.business || 0) >= FREE_SERVICE_LIMIT} className="h-11 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50">Simpan profil</button>
            </form>}

            {tool === "documents" && <>
              <div className="no-print grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm font-medium">Jenis dokumen<select value={docType} onChange={(event) => setDocType(event.target.value)} className="h-11 w-full rounded-lg border border-input bg-background px-3 font-normal"><option>Surat Penawaran</option><option>Surat Perintah Kerja</option><option>Kwitansi</option></select></label>
                <label className="space-y-2 text-sm font-medium">Judul / nomor dokumen<input value={docTitle} onChange={(event) => setDocTitle(event.target.value)} placeholder="Contoh: Penawaran Desain Logo" className="h-11 w-full rounded-lg border border-input bg-background px-3 font-normal" /></label>
              </div>
              <label className="no-print mt-4 block space-y-2 text-sm font-medium">Isi dokumen<textarea value={docBody} onChange={(event) => setDocBody(event.target.value)} placeholder="Tuliskan isi, rincian pekerjaan, nominal, dan ketentuan..." rows={6} className="w-full rounded-lg border border-input bg-background px-3 py-3 font-normal" /></label>
              <article className="mt-6 rounded-xl border border-border bg-white p-6 text-slate-900 sm:p-10"><p className="text-center text-xs font-semibold uppercase tracking-[.2em] text-slate-500">{business || "Nama Usaha"}</p><h3 className="mt-6 text-center text-xl font-bold">{docType}</h3><p className="mt-2 text-center text-sm text-slate-500">{docTitle || "Judul dokumen"}</p><div className="my-6 h-px bg-slate-200"/><p className="whitespace-pre-wrap text-sm leading-7">{docBody || "Isi dokumen yang kamu tulis akan tampil di sini."}</p><p className="mt-10 text-sm text-slate-500">{address}</p><p className="mt-8 text-right text-sm text-slate-500">{business || "Nama Usaha"}</p></article>
              <button disabled={(usage.documents || 0) >= FREE_SERVICE_LIMIT} onClick={() => { if (consumeUsage("documents")) window.print(); }} className="no-print mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"><Printer className="h-4 w-4" /> Cetak / simpan PDF</button>
            </>}

            {tool === "history" && <>
              {invoices.length ? <div className="divide-y divide-border">{invoices.map((invoice) => <div key={invoice.number} className="flex flex-wrap items-center justify-between gap-4 py-4"><div><p className="font-semibold">{invoice.number} <span className="font-normal text-muted-foreground">· {invoice.customer}</span></p><p className="mt-1 text-sm text-muted-foreground">{invoice.description} · {invoice.date}</p></div><div className="flex items-center gap-3"><p className="font-semibold">{formatCurrency(invoice.amount)}</p><select disabled={(usage.history || 0) >= FREE_SERVICE_LIMIT} aria-label={`Status ${invoice.number}`} value={invoice.status || "Belum dibayar"} onChange={(event) => setInvoiceStatus(invoice.number, event.target.value)} className="h-9 rounded-lg border border-input bg-background px-2 text-sm disabled:opacity-50"><option>Belum dibayar</option><option>Lunas</option></select></div></div>)}</div> : <div className="rounded-xl border border-dashed border-border p-8 text-center"><History className="mx-auto h-8 w-8 text-primary"/><p className="mt-3 font-medium">Riwayat invoice masih kosong</p><p className="mt-1 text-sm text-muted-foreground">Invoice yang dibuat dari perangkat ini akan tampil di sini.</p><Link href="/coba" className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground">Buat invoice <ArrowRight className="h-4 w-4" /></Link></div>}
              {quotaNotice("history")}
            </>}

            {tool === "whatsapp" && <form onSubmit={(event) => { event.preventDefault(); if (!consumeUsage("whatsapp")) return; const target = waPhone.replace(/\D/g, "").replace(/^0/, "62"); window.open(`https://wa.me/${target}?text=${encodeURIComponent(waMessage)}`, "_blank", "noopener,noreferrer"); }} className="max-w-xl space-y-4">
              <label className="block space-y-2 text-sm font-medium">Nomor WhatsApp pelanggan<input required type="tel" value={waPhone} onChange={(event) => setWaPhone(event.target.value)} placeholder="081234567890" className="h-11 w-full rounded-lg border border-input bg-background px-3 font-normal" /></label>
              <label className="block space-y-2 text-sm font-medium">Pesan<textarea required rows={5} value={waMessage} onChange={(event) => setWaMessage(event.target.value)} placeholder="Halo, berikut invoice untuk pekerjaan..." className="w-full rounded-lg border border-input bg-background px-3 py-3 font-normal" /></label>
              <button disabled={(usage.whatsapp || 0) >= FREE_SERVICE_LIMIT} className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-50"><MessageCircle className="h-4 w-4" /> Buka WhatsApp</button>
            </form>}
          </section>
        </div>
      </div>
      <div className="mx-auto mt-12 max-w-6xl"><SiteFooter /></div>
    </main>
  );
}
