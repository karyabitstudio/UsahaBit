"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/BrandLogo";
import { createClient } from "@/lib/supabase/client";

export default function AcceptInvitePage() {
  const router = useRouter();
  const started = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    async function acceptInvite() {
      const url = new URL(window.location.href);
      const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
      const code = url.searchParams.get("code");
      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      const supabase = createClient();

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) throw exchangeError;
      } else if (accessToken && refreshToken) {
        const { error: sessionError } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (sessionError) throw sessionError;
      } else {
        const message = hash.get("error_description") || url.searchParams.get("error_description");
        throw new Error(message || "Tautan undangan tidak valid atau sudah kedaluwarsa. Minta pemilik workspace mengirim ulang undangan.");
      }

      window.history.replaceState({}, "", "/auth/accept-invite");
      const { error: acceptError } = await fetch("/api/dashboard/team/accept-invite", { method: "POST" }).then(async (response) => {
        const result = await response.json();
        return response.ok ? { error: null } : { error: new Error(result.error || "Undangan gagal diterima.") };
      });
      if (acceptError) throw acceptError;
      router.replace("/dashboard/team");
      router.refresh();
    }

    void acceptInvite().catch((cause: unknown) => {
      setError(cause instanceof Error ? cause.message : "Undangan gagal diterima. Silakan coba lagi.");
    });
  }, [router]);

  return <main className="flex min-h-screen items-center justify-center px-4 py-10"><section className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-xl"><div className="mb-5 flex justify-center"><BrandLogo size={42} /></div><h1 className="text-center text-xl font-bold">Menerima undangan tim</h1>{error ? <><p role="alert" className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p><p className="mt-4 text-center text-sm text-muted-foreground">Pastikan email yang menerima undangan sama dengan akun yang digunakan.</p><div className="mt-5 flex justify-center gap-4 text-sm"><Link href="/login" className="font-semibold text-primary hover:underline">Masuk</Link><Link href="/" className="text-muted-foreground hover:underline">Beranda</Link></div></> : <p className="mt-3 text-center text-sm text-muted-foreground">Memverifikasi tautan dan menambahkan akun ke workspace…</p>}</section></main>;
}
