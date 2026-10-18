"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SettingsFormProps {
  profile: any;
}

export function SettingsForm({ profile }: SettingsFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [businessName, setBusinessName] = useState(
    profile?.business_name || "",
  );
  const [phone, setPhone] = useState(profile?.phone || "");
  const [brandColor, setBrandColor] = useState(
    profile?.brand_color || "#2563eb",
  );
  const [logoUrl, setLogoUrl] = useState(profile?.logo_url || "");
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    const fileExt = file.name.split(".").pop();
    const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
    const filePath = `logos/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("logos")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      setError("Gagal upload logo: " + uploadError.message);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("logos").getPublicUrl(filePath);
    setLogoUrl(data.publicUrl);
    setUploading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
        business_name: businessName,
        phone: phone || null,
        brand_color: brandColor,
        logo_url: logoUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", profile.id);

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setMessage("Pengaturan berhasil disimpan!");
    setLoading(false);
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-md">
          {error}
        </div>
      )}
      {message && (
        <div className="text-sm text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 p-3 rounded-md">
          {message}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Profil Bisnis</CardTitle>
          <CardDescription>
            Informasi yang muncul di invoice dan surat
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nama Lengkap</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessName">Nama Usaha</Label>
            <Input
              id="businessName"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Contoh: Toko Budi Sejahtera"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">No. Telepon / WhatsApp</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="08123456789"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Branding Invoice</CardTitle>
          <CardDescription>
            Logo dan warna yang muncul di PDF invoice
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Logo Usaha</Label>
            <div className="flex items-center gap-4">
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="Logo"
                  className="h-16 w-16 object-contain border rounded-md"
                />
              ) : (
                <div className="h-16 w-16 bg-muted border rounded-md flex items-center justify-center text-xs text-muted-foreground">
                  Belum ada
                </div>
              )}
              <div>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploading}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  PNG/JPG, maksimal 1MB. Disarankan latar transparan.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="brandColor">Warna Brand</Label>
            <div className="flex items-center gap-3">
              <Input
                id="brandColor"
                type="color"
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="w-16 h-10 p-1 cursor-pointer"
              />
              <Input
                value={brandColor}
                onChange={(e) => setBrandColor(e.target.value)}
                className="flex-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={loading || uploading}>
        {loading ? "Menyimpan..." : "Simpan Perubahan"}
      </Button>
    </form>
  );
}
