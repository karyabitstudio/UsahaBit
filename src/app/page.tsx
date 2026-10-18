import Link from "next/link";
import { Suspense } from "react";
import { buttonVariants } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";
import { SiteFooter } from "@/components/SiteFooter";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin-auth";
import { DEFAULT_SITE_SETTINGS, type SiteSettings } from "@/lib/site-settings";
import {
  FileText,
  Users,
  ArrowRight,
  FileCheck2,
  MessageCircle,
  CircleDollarSign,
  Palette,
  Clock3,
  ScrollText,
  Package,
} from "lucide-react";

const features = [
  { icon: FileText, title: "Invoice profesional", desc: "Buat tagihan dengan rincian item, pajak, dan tanggal jatuh tempo." },
  { icon: FileCheck2, title: "PDF siap kirim", desc: "Unduh invoice rapi dengan identitas dan branding bisnismu." },
  { icon: Users, title: "Data pelanggan", desc: "Simpan kontak klien dan gunakan lagi saat membuat tagihan." },
  { icon: MessageCircle, title: "Kirim via WhatsApp", desc: "Bagikan detail tagihan ke pelanggan dengan pesan otomatis." },
  { icon: CircleDollarSign, title: "Pantau pembayaran", desc: "Lihat status invoice dan tagihan yang masih perlu ditindaklanjuti." },
  { icon: Palette, title: "Branding usaha", desc: "Atur profil, logo, dan warna usaha yang tampil di invoice." },
  { icon: Clock3, title: "Riwayat invoice", desc: "Kelola daftar tagihan yang sudah dibuat dari satu tempat." },
];

function HeroText({ settings }: { settings: SiteSettings }) {
  return (
    <>
      <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
        <span className="h-2 w-2 rounded-full bg-primary" /> {settings.heroBadge}
      </div>
      <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
        {settings.heroTitle} <span className="text-primary">{settings.heroAccent}</span>
      </h1>
      <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
        {settings.heroDescription}
      </p>
    </>
  );
}

async function DynamicHeroText() {
  const supabase = await createClient();
  const { data: savedSettings } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "public")
    .maybeSingle();
  const saved = savedSettings?.value as Partial<SiteSettings> | undefined;
  const settings: SiteSettings = {
    ...DEFAULT_SITE_SETTINGS,
    ...saved,
    salesWhatsapp: saved?.salesWhatsapp || DEFAULT_SITE_SETTINGS.salesWhatsapp,
    pricing: { ...DEFAULT_SITE_SETTINGS.pricing, ...saved?.pricing },
  };
  return <HeroText settings={settings} />;
}

async function AdminLandingTools() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!isAdminEmail(user?.email)) return null;

  return (
    <section className="border-b border-primary/20 bg-primary/[.05] px-4 py-3 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium"><span className="text-primary">Mode admin</span><span className="ml-2 text-muted-foreground">Kelola situs atau buka dashboard tanpa meninggalkan akses admin.</span></p>
        <div className="flex flex-wrap gap-2">
          <Link href="/dashboard" className={buttonVariants({ size: "sm", variant: "outline" })}>Dashboard utama</Link>
          <Link href="/admin" className={buttonVariants({ size: "sm" })}>Panel admin</Link>
        </div>
      </div>
    </section>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="UsahaBit - Beranda"><BrandLogo size={42} /></Link>
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link href="/tutorial" className="hidden px-2 py-2 text-sm text-muted-foreground transition hover:text-foreground md:block">Tutorial</Link>
            <Link href="/pricing" className="hidden px-2 py-2 text-sm text-muted-foreground transition hover:text-foreground md:block">Harga</Link>
            <Link href="/login" className={buttonVariants({ variant: "ghost", className: "rounded-full px-3 text-xs sm:text-sm" })}>Masuk</Link>
            <Link href="/register" className={buttonVariants({ variant: "outline", className: "rounded-full px-3 text-xs sm:text-sm" })}>Daftar</Link>
            <Link href="/coba/layanan" className={buttonVariants({ className: "rounded-full px-3 text-xs sm:px-5 sm:text-sm" })}>Coba gratis <ArrowRight className="ml-1 h-4 w-4 sm:ml-2" /></Link>
          </nav>
        </div>
      </header>

      <Suspense fallback={null}><AdminLandingTools /></Suspense>

      <section className="relative overflow-hidden px-4 py-16 sm:px-6 sm:py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/15 via-background/30 to-transparent" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_.95fr]">
          <div>
            <Suspense fallback={<HeroText settings={DEFAULT_SITE_SETTINGS} />}>
              <DynamicHeroText />
            </Suspense>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/coba" className={buttonVariants({ size: "lg", className: "rounded-full px-7" })}>Buat invoice gratis <ArrowRight className="ml-2 h-4 w-4" /></Link>
              <Link href="/pricing" className={buttonVariants({ size: "lg", variant: "outline", className: "rounded-full px-7" })}>Lihat paket</Link>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">Coba alat usaha langsung dari halaman layanan</p>
          </div>

          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-5 rounded-[2rem] bg-primary/10 blur-2xl" />
            <div className="relative rounded-3xl border border-border bg-card p-5 shadow-2xl shadow-primary/5 sm:p-7">
              <div className="flex items-start justify-between border-b border-border pb-5">
                <div><p className="text-xs font-semibold uppercase tracking-[.18em] text-primary">Invoice</p><h2 className="mt-2 text-xl font-bold">Tagihan #UB-0248</h2></div>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><FileCheck2 className="h-5 w-5" /></div>
              </div>
              <div className="space-y-5 py-6">
                <div className="flex justify-between gap-4"><div><p className="text-xs text-muted-foreground">DARI</p><p className="mt-1 font-semibold">Studio Senja</p></div><div className="text-right"><p className="text-xs text-muted-foreground">UNTUK</p><p className="mt-1 font-semibold">Kedai Pagi</p></div></div>
                <div className="rounded-xl bg-muted/60 p-4"><div className="flex justify-between text-sm"><span>Desain identitas brand</span><span>Rp 1.500.000</span></div><div className="mt-3 flex justify-between border-t border-border pt-3 font-semibold"><span>Total</span><span className="text-primary">Rp 1.500.000</span></div></div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Siap diunduh sebagai PDF</div>
              </div>
              <Link href="/coba/layanan" className="flex h-11 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground transition hover:bg-primary/90">Coba layanan UsahaBit</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-border/70 bg-muted/30 px-4 py-14 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <div className="mx-auto mb-9 max-w-xl text-center"><p className="text-sm font-semibold uppercase tracking-[.16em] text-primary">UsahaBit</p><h2 className="mt-3 text-2xl font-bold sm:text-3xl">Perangkat administrasi yang mudah dipakai</h2><p className="mt-3 text-muted-foreground">Mulai dari satu invoice, lalu gunakan fitur yang cocok dengan kebutuhan usahamu.</p></div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => <Link href="/coba/layanan" key={feature.title} className="glass-panel group rounded-2xl p-5 transition hover:-translate-y-0.5 hover:border-primary/40 sm:p-6"><div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><feature.icon className="h-5 w-5" /></div><h3 className="font-semibold">{feature.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{feature.desc}</p><span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">Coba layanan <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" /></span></Link>)}
          </div>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 text-center sm:flex-row sm:gap-6">
            <Link href="/coba/layanan" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-primary"><ScrollText className="h-4 w-4 text-primary" /> Coba generator surat</Link>
            <Link href="/coba/layanan" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-primary"><Package className="h-4 w-4 text-primary" /> Coba katalog produk</Link>
          </div>
          <div className="mt-6 flex justify-center"><Link href="/coba/layanan" className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">Jelajahi semua layanan <ArrowRight className="h-4 w-4" /></Link></div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-4xl rounded-3xl border border-border bg-card px-6 py-10 text-center sm:px-12 sm:py-14">
          <h2 className="text-2xl font-bold sm:text-3xl">Semua alat usaha, langsung bisa dicoba</h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Buat invoice, kelola data, susun surat, dan siapkan pesan WhatsApp dari satu tempat.</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row"><Link href="/coba/layanan" className={buttonVariants({ size: "lg", className: "rounded-full px-7" })}>Coba semua layanan</Link><Link href="/pricing" className={buttonVariants({ size: "lg", variant: "outline", className: "rounded-full px-7" })}>Lihat paket</Link></div>
        </div>
      </section>

      <section className="border-y border-border/70 bg-muted/30 px-4 py-16 sm:px-6 sm:py-20" id="faq">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <p className="text-sm font-semibold uppercase tracking-[.16em] text-primary">FAQ</p>
            <h2 className="mt-3 text-2xl font-bold sm:text-3xl">Pertanyaan yang sering diajukan</h2>
            <p className="mt-3 text-muted-foreground">Informasi singkat sebelum mulai menggunakan UsahaBit.</p>
          </div>
          <div className="space-y-3">
            {[
              { question: "Layanan apa saja yang bisa dicoba?", answer: "Kamu bisa mencoba pembuatan invoice, katalog produk, data pelanggan, dan alat administrasi lain yang tersedia di halaman layanan." },
              { question: "Berapa batas penggunaan gratis?", answer: "Paket gratis mencakup hingga 3 invoice per bulan dan 3 penggunaan demo per layanan per bulan. Detail paket dapat dilihat di halaman Harga." },
              { question: "Apakah perlu membuat akun untuk mencoba?", answer: "Tidak. Layanan demo bisa langsung dicoba tanpa akun. Masuk atau daftar jika ingin menggunakan dashboard dan menyimpan data ke akun." },
              { question: "Di mana data demo saya disimpan?", answer: "Data demo tersimpan di browser yang sedang digunakan dan tidak otomatis masuk ke database. Data browser dapat hilang jika penyimpanan situs dibersihkan atau kamu berpindah perangkat." },
              { question: "Bagaimana cara mengunduh invoice?", answer: "Isi detail invoice, lalu gunakan tombol buat atau unduh PDF untuk menyimpan dokumen dan membagikannya kepada klien." },
              { question: "Bagaimana jika batas gratis sudah habis?", answer: "Kamu bisa melihat paket berbayar di halaman Harga untuk melanjutkan penggunaan sesuai kebutuhan." },
            ].map((item) => (
              <details key={item.question} className="group rounded-2xl border border-border bg-card px-5 py-4 open:border-primary/35 sm:px-6">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold [&::-webkit-details-marker]:hidden">
                  {item.question}
                  <span aria-hidden="true" className="text-xl font-normal text-primary transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 max-w-2xl pr-8 text-sm leading-6 text-muted-foreground">{item.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <SiteFooter />
    </main>
  );
}
