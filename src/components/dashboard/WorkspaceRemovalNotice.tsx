"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type WorkspaceNotice = { id: string; kind: "removed_from_workspace"; workspace_name: string; created_at: string };

export function WorkspaceRemovalNotice() {
  const router = useRouter();
  const [notice, setNotice] = useState<WorkspaceNotice | null>(null);
  const refreshed = useRef(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const response = await fetch("/api/dashboard/notifications", { cache: "no-store" });
        if (!response.ok) return;
        const result = await response.json();
        if (!mounted) return;
        const next = (result.notifications || []).find((item: WorkspaceNotice) => item.kind === "removed_from_workspace") || null;
        setNotice(next);
        if (next && !refreshed.current) {
          refreshed.current = true;
          router.refresh();
        }
      } catch {
        // A failed notification check should not block dashboard use.
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

  if (!notice) return null;
  return <div role="status" className="mb-5 flex items-start justify-between gap-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-foreground">
    <div className="flex items-start gap-3"><Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" /><p><span className="font-semibold">Anda telah dikeluarkan dari workspace {notice.workspace_name}.</span><br />Akses ke data workspace tersebut sudah dihentikan. Anda sekarang menggunakan workspace akun sendiri.</p></div>
    <Button type="button" variant="ghost" size="icon" aria-label="Tutup notifikasi" onClick={() => void dismiss()}><X className="h-4 w-4" /></Button>
  </div>;
}
