import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Package } from "lucide-react";

export default function ProductsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Produk</h1>
        <p className="text-muted-foreground">
          Kelola katalog produk untuk mempercepat pembuatan invoice
        </p>
      </div>

      <div className="rounded-xl border bg-card p-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Package className="h-7 w-7" />
        </div>
        <h2 className="text-lg font-semibold">Katalog Produk</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Fitur katalog produk akan segera hadir. Kamu tetap bisa menuliskan item
          secara manual saat membuat invoice.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/dashboard/invoices/new" className={buttonVariants()}>
            Buat Invoice
          </Link>
          <Link
            href="/dashboard/clients"
            className={buttonVariants({ variant: "outline" })}
          >
            Kelola Client
          </Link>
        </div>
      </div>
    </div>
  );
}
