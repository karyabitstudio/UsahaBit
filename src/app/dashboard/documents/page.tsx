import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { File } from "lucide-react";

export default function DocumentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Surat Resmi</h1>
        <p className="text-muted-foreground">
          Buat SPK, surat penawaran, kwitansi, dan dokumen usaha lainnya
        </p>
      </div>

      <div className="rounded-xl border bg-card p-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <File className="h-7 w-7" />
        </div>
        <h2 className="text-lg font-semibold">Fitur Surat Resmi</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Template surat resmi sedang disiapkan. Sementara kamu bisa fokus memakai
          Invoice & Client terlebih dahulu.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/dashboard/invoices/new" className={buttonVariants()}>
            Buat Invoice dulu
          </Link>
          <Link
            href="/dashboard"
            className={buttonVariants({ variant: "outline" })}
          >
            Kembali ke Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
