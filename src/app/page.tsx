import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";
import { FileText, Users, Zap, Shield } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/75 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" aria-label="UsahaBit - Beranda">
            <BrandLogo size={42} />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
              Masuk
            </Link>
            <Link href="/register" className={buttonVariants()}>
              Daftar Gratis
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden px-4 py-24">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-primary/15 via-background/30 to-transparent" />
        <div className="pointer-events-none absolute -top-12 left-1/2 h-64 w-64 -translate-x-1/2 animate-float-slow rounded-full bg-primary/10 blur-3xl" />
        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <div className="mb-7 inline-flex animate-rise-in items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm font-medium text-primary shadow-[0_0_30px_color-mix(in_oklch,var(--primary)_12%,transparent)]">
            <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" />
            Solusi praktis untuk bisnis Indonesia
          </div>
          <h1 className="animate-rise-in text-3xl font-bold tracking-tight [animation-delay:100ms] sm:text-4xl md:text-6xl">
            Buat Invoice &amp; Surat Resmi{" "}
            <span className="text-primary text-glow">Rapi dalam 1 Menit</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl animate-rise-in text-lg text-muted-foreground [animation-delay:200ms]">
            UsahaBit adalah aplikasi administrasi untuk UMKM Indonesia. Simpan
            data klien, buat invoice profesional, kirim tagihan lewat WhatsApp,
            unduh PDF, dan pantau status pembayaran dalam satu tempat.
          </p>
          <div className="mt-8 flex animate-rise-in flex-col justify-center gap-4 [animation-delay:300ms] sm:flex-row">
            <Link href="/register" className={buttonVariants({ size: "lg" })}>
              Mulai Gratis Sekarang
            </Link>
            <Link
              href="/pricing"
              className={buttonVariants({ size: "lg", variant: "outline" })}
            >
              Lihat Harga
            </Link>
          </div>
          <p className="mt-4 animate-rise-in text-sm text-muted-foreground [animation-delay:300ms]">
            Tidak perlu kartu kredit • 5 invoice gratis setiap bulan
          </p>
        </div>
      </section>

      <section className="bg-muted/30 px-4 py-12 sm:py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-8 text-center text-2xl font-bold sm:mb-12 sm:text-3xl">
            Semua yang Dibutuhkan UMKM
          </h2>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: FileText,
                title: "Invoice Profesional",
                desc: "Buat invoice rapi dengan logo dan warna usahamu sendiri.",
              },
              {
                icon: Users,
                title: "Kelola Client",
                desc: "Simpan data client dan gunakan ulang saat buat invoice.",
              },
              {
                icon: Zap,
                title: "Cepat & Mudah",
                desc: "Dari isi data sampai download PDF hanya butuh hitungan detik.",
              },
              {
                icon: Shield,
                title: "Data Aman",
                desc: "Semua data tersimpan aman dan hanya bisa diakses olehmu.",
              },
            ].map((feature, index) => (
              <div
                key={feature.title}
                className="glass-panel animate-rise-in rounded-2xl p-4 transition-all duration-300 hover:-translate-y-2 hover:border-primary/40 hover:shadow-[0_20px_55px_color-mix(in_oklch,var(--primary)_14%,transparent)] sm:p-6"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary shadow-[inset_0_0_18px_color-mix(in_oklch,var(--primary)_14%,transparent)]">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-20">
        <div className="glass-panel mx-auto max-w-3xl rounded-3xl px-6 py-12 text-center md:px-12">
          <h2 className="mb-4 text-2xl font-bold sm:text-3xl">
            Siap bikin usaha lebih profesional?
          </h2>
          <p className="mb-8 text-muted-foreground">
            Bergabung dengan ratusan UMKM yang sudah memakai UsahaBit.
          </p>
          <Link href="/register" className={buttonVariants({ size: "lg" })}>
            Daftar Gratis — Tidak Perlu Kartu Kredit
          </Link>
        </div>
      </section>

      <footer className="border-t px-4 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <p>© 2026 UsahaBit. Dibuat untuk UMKM Indonesia.</p>
          <div className="flex flex-wrap gap-3 sm:gap-6">
            <Link href="/pricing" className="hover:text-foreground">
              Harga
            </Link>
            <Link href="/login" className="hover:text-foreground">
              Masuk
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
