"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { BrandLogo } from "@/components/BrandLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const handleResendConfirmation = async () => {
    setResending(true);
    setError(null);
    setResendMessage(null);

    const { error } = await supabase.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(`Email konfirmasi gagal dikirim: ${error.message}`);
    } else {
      setResendMessage(
        "Permintaan kirim ulang berhasil. Periksa Inbox, Spam, dan folder Promosi.",
      );
    }
    setResending(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    let accountCreated = false;

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            full_name: fullName,
            business_name: businessName,
          },
        },
      });

      if (error) throw error;
      accountCreated = Boolean(data.user);

      if (data.user && !data.session) {
        setMessage(
          "Akun berhasil dibuat, tetapi konfirmasi email masih aktif. Matikan Confirm email di Supabase Authentication → Sign In / Providers → Email agar pengguna langsung masuk ke dashboard.",
        );
        setLoading(false);
        return;
      }

      if (data.user && data.session) {
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: data.user.id,
          email: data.user.email,
          full_name: fullName,
          business_name: businessName,
        });
        if (profileError) {
          console.error("Unable to save profile after signup:", profileError);
          router.replace("/dashboard?warning=profile");
          router.refresh();
          return;
        }
      }

      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "object" &&
              err !== null &&
              "message" in err &&
              typeof err.message === "string"
            ? err.message
            : "Terjadi kesalahan saat mendaftar.";
      setError(
        accountCreated
          ? `Akun berhasil dibuat, tetapi ${message}`
          : message === "Failed to fetch"
            ? "Tidak dapat terhubung ke Supabase. Periksa URL project dan koneksi internet, lalu coba lagi."
            : message,
      );
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="glass-panel w-full max-w-md animate-rise-in rounded-2xl">
        <CardHeader className="space-y-1">
          <BrandLogo size={48} className="mb-3" />
          <CardTitle className="text-xl font-bold sm:text-2xl">
            Buat Akun UsahaBit
          </CardTitle>
          <CardDescription>
            Mulai kelola invoice & surat resmi bisnismu
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleRegister}>
          <CardContent className="space-y-4">
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-md">
                {error}
              </div>
            )}
            {message && (
              <div className="text-sm text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 p-3 rounded-md">
                {message}
                {message.startsWith("Akun berhasil dibuat") && (
                  <div className="mt-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={resending || !email}
                      onClick={handleResendConfirmation}
                    >
                      {resending ? "Mengirim..." : "Kirim ulang email konfirmasi"}
                    </Button>
                  </div>
                )}
              </div>
            )}
            {resendMessage && (
              <p className="text-sm text-muted-foreground" role="status">
                {resendMessage}
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="fullName">Nama Lengkap</Label>
              <Input
                id="fullName"
                type="text"
                placeholder="Budi Santoso"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessName">Nama Usaha</Label>
              <Input
                id="businessName"
                type="text"
                placeholder="Toko Budi Sejahtera"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@contoh.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Mendaftar..." : "Daftar Sekarang"}
            </Button>

            <p className="text-sm text-center text-muted-foreground">
              Sudah punya akun?{" "}
              <Link
                href="/login"
                className="text-primary hover:underline font-medium"
              >
                Masuk di sini
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
