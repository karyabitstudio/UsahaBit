"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { BrandLogo } from "@/components/BrandLogo";
import { GoogleAuthButton } from "@/components/auth/GoogleAuthButton";
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

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const errorType = new URLSearchParams(window.location.search).get("error");
    const message = errorType === "not_admin"
      ? "Akun ini belum terdaftar sebagai admin. Periksa ADMIN_EMAILS di .env.local."
      : errorType === "profile"
        ? "Akun berhasil dikonfirmasi, tetapi profil belum tersimpan. Coba masuk lagi atau hubungi admin."
        : errorType === "auth"
          ? "Proses masuk gagal. Silakan coba lagi."
          : null;
    if (!message) return undefined;
    const timeout = window.setTimeout(() => setError(message), 0);
    return () => window.clearTimeout(timeout);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const metadata = data.user.user_metadata ?? {};
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: data.user.id,
        email: data.user.email,
        full_name:
          typeof metadata.full_name === "string" ? metadata.full_name : null,
        business_name:
          typeof metadata.business_name === "string"
            ? metadata.business_name
            : null,
      },
      { onConflict: "id", ignoreDuplicates: true },
    );

    if (profileError) {
      console.error("Unable to save profile after login:", profileError);
      router.replace("/dashboard?warning=profile");
      router.refresh();
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="glass-panel w-full max-w-md animate-rise-in rounded-2xl">
        <CardHeader className="space-y-1">
          <BrandLogo size={48} className="mb-3" />
          <CardTitle className="text-xl font-bold sm:text-2xl">
            Masuk ke UsahaBit
          </CardTitle>
          <CardDescription>
            Kelola invoice dan surat resmi bisnismu
          </CardDescription>
        </CardHeader>

        <form onSubmit={handleLogin}>
          <CardContent className="space-y-4">
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-md">
                {error}
              </div>
            )}

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
                placeholder="Masukkan password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Masuk..." : "Masuk"}
            </Button>

            <div className="flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />atau<span className="h-px flex-1 bg-border" /></div>
            <GoogleAuthButton mode="login" />

            <p className="text-sm text-center text-muted-foreground">
              Belum punya akun?{" "}
              <Link
                href="/register"
                className="text-primary hover:underline font-medium"
              >
                Daftar sekarang
              </Link>
            </p>
            <Link
              href="/admin/login"
              className="text-sm text-center text-muted-foreground hover:text-primary"
            >
              Login admin
            </Link>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
