import Link from "next/link";
import { Mail } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background px-4 py-8 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/" aria-label="UsahaBit - Beranda"><BrandLogo size={38} /></Link>
          <p className="mt-2 text-sm text-muted-foreground">Perangkat administrasi usaha dalam satu tempat.</p>
        </div>
        <nav aria-label="Navigasi footer" className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
          <Link href="/coba/layanan" className="transition hover:text-foreground">Layanan</Link>
          <Link href="/tutorial" className="transition hover:text-foreground">Tutorial</Link>
          <Link href="/pricing" className="transition hover:text-foreground">Harga</Link>
        </nav>
        <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:text-right">
          <a href="mailto:karyabitstudio@gmail.com" className="inline-flex items-center gap-2 transition hover:text-foreground sm:justify-end"><Mail className="h-4 w-4" aria-hidden="true" />karyabitstudio@gmail.com</a>
          <a href="https://www.instagram.com/karyabit.studio/" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 transition hover:text-foreground sm:justify-end"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".75" fill="currentColor" stroke="none" /></svg>@karyabit.studio</a>
        </div>
      </div>
      <div className="mx-auto mt-6 max-w-6xl border-t border-border pt-5 text-xs text-muted-foreground">
        © 2026 UsahaBit. Dibuat untuk UMKM Indonesia.
      </div>
    </footer>
  );
}
