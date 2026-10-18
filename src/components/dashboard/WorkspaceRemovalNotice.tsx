"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type WorkspaceNotice = { id: string; kind: "removed_from_workspace" | "added_to_workspace"; workspace_name: string; created_at: string };

export function WorkspaceRemovalNotice() {
  const router = useRouter();
  const [notice, setNotice] = useState<WorkspaceNotice | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const refreshedNoticeId = useRef<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const response = await fetch("/api/dashboard/notifications", { cache: "no-store" });
        const result = await response.json();
        if (!response.ok) {
          if (mounted) setLoadError(result.error || "Notifikasi gagal dimuat.");
          return;
        }
        if (!mounted) return;
        setLoadError(null);
        const next = (result.notifications || [])[0] || null;
        setNotice(next);
        if (next && refreshedNoticeId.current !== next.id) {
          refreshedNoticeId.current = next.id;
          router.refresh();
        }
      } catch {
        if (mounted) setLoadError("Notifikasi belum dapat diperiksa. Periksa koneksi lalu muat ulang dashboard.");
      }
    }
    void load();
    const interval = window.setInterval(() => void load(), 10000);
    return () => { mounted = false; window.clearInterval(interval); };
  }, [router]);

  async function dismiss() {
    if (!notice) return;
    const response = await fetch("/api/dashboard/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: notice.id }),
    });
    if (response.ok) setNotice(null);
  }

  if (loadError) return <div role="alert" className="mb-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-foreground">{loadError}</div>;
  if (!notice) return null;
  const added = notice.kind === "added_to_workspace";
  return <div role="status" className={`mb-5 flex items-start justify-between gap-4 rounded-xl border p-4 text-sm text-foreground ${added ? "border-emerald-500/30 bg-emerald-500/10" : "border-amber-500/30 bg-amber-500/10"}`}>
    <div className="flex items-start gap-3"><Info className={`mt-0.5 h-5 w-5 shrink-0 ${added ? "text-emerald-600" : "text-amber-600"}`} /><p><span className="font-semibold">{added ? `Anda telah ditambahkan ke workspace ${notice.workspace_name}.` : `Anda telah dikeluarkan dari workspace ${notice.workspace_name}.`}</span><br />{added ? "Akses ke data dan fitur sesuai paket workspace sudah aktif." : "Akses ke data workspace tersebut sudah dihentikan. Anda sekarang menggunakan workspace akun sendiri."}</p></div>
    <Button type="button" variant="ghost" size="icon" aria-label="Tutup notifikasi" onClick={() => void dismiss()}><X className="h-4 w-4" /></Button>
  </div>;
}
