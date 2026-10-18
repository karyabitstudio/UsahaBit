"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recoveryError, setRecoveryError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const currentUrl = new URL(window.location.href);
    const query = currentUrl.searchParams;
    const hash = new URLSearchParams(currentUrl.hash.replace(/^#/, ""));
    const tokenHash = query.get("token_hash");
    const authError = query.get("error_description") || hash.get("error_description");
    if (authError) setRecoveryError(authError);

    void (async () => {
      let session = (await supabase.auth.getSession()).data.session;

      if (!session && tokenHash && query.get("type") === "recovery") {
        const { data, error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "recovery",
        });
        session = data.session;
        if (verifyError) setRecoveryError(verifyError.message);
      }

      if (!session) {
        const accessToken = hash.get("access_token") || query.get("access_token");
        const refreshToken = hash.get("refresh_token") || query.get("refresh_token");
        if (accessToken && refreshToken) {
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          session = data.session;
          if (sessionError) setRecoveryError(sessionError.message);
        }
      }

      if (alive) {
        setHasSession(Boolean(session));
        setReady(true);
      }
    })();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(Boolean(session));
    });
    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      return;
    }
    if (password !== confirmation) {
      setError("Konfirmasi password belum sama.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }
    await supabase.auth.signOut();
    router.replace("/admin/login?password=updated");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="glass-panel w-full max-w-md rounded-2xl">
        <CardHeader className="space-y-3">
          <BrandLogo size={48} />
          <CardTitle className="text-xl font-bold sm:text-2xl">Buat password baru</CardTitle>
          <CardDescription>Atur password akun UsahaBit, lalu masuk kembali dengan password baru.</CardDescription>
        </CardHeader>
        <CardContent>
          {!ready ? <p className="py-4 text-sm text-muted-foreground">Memeriksa tautan pemulihan...</p> : !hasSession ? <div className="space-y-4"><p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{recoveryError ? `Tautan pemulihan ditolak: ${recoveryError}` : "Tautan pemulihan tidak valid atau sudah kedaluwarsa. Minta email pemulihan baru dari Supabase."}</p><Link href="/admin/login" className="text-sm font-semibold text-primary hover:underline">Kembali ke login admin</Link></div> : <form onSubmit={updatePassword} className="space-y-4">
            {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
            <div className="space-y-2"><Label htmlFor="new-password">Password baru</Label><Input id="new-password" type="password" autoComplete="new-password" minLength={8} value={password} onChange={(event) => setPassword(event.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="confirm-password">Ulangi password baru</Label><Input id="confirm-password" type="password" autoComplete="new-password" minLength={8} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required /></div>
            <Button type="submit" className="w-full" disabled={loading}>{loading ? "Menyimpan..." : "Simpan password baru"}</Button>
          </form>}
        </CardContent>
      </Card>
    </main>
  );
}
