import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { DEFAULT_SITE_SETTINGS, type SiteSettings } from "@/lib/site-settings";

function isAdminEmail(email: string | undefined) {
  if (!email) return false;
  const admins = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(email.toLowerCase());
}

export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "public")
    .maybeSingle();

  const value = data?.value as Partial<SiteSettings> | undefined;
  return NextResponse.json({
    ...DEFAULT_SITE_SETTINGS,
    ...value,
    salesWhatsapp: value?.salesWhatsapp || DEFAULT_SITE_SETTINGS.salesWhatsapp,
    pricing: { ...DEFAULT_SITE_SETTINGS.pricing, ...value?.pricing },
  });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan masuk sebagai admin." }, { status: 401 });
  if (!isAdminEmail(user.email)) return NextResponse.json({ error: "Akses admin ditolak." }, { status: 403 });

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Data pengaturan tidak valid." }, { status: 400 });
  }

  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ error: "Data pengaturan tidak valid." }, { status: 400 });
  }
  const settings = payload as Partial<SiteSettings>;
  if (
    typeof settings.heroBadge !== "string" ||
    typeof settings.heroTitle !== "string" ||
    typeof settings.heroAccent !== "string" ||
    typeof settings.heroDescription !== "string" ||
    typeof settings.salesWhatsapp !== "string" ||
    !settings.heroBadge.trim() || !settings.heroTitle.trim() ||
    !settings.heroAccent.trim() || !settings.heroDescription.trim()
  ) {
    return NextResponse.json({ error: "Judul dan deskripsi wajib diisi." }, { status: 400 });
  }

  const pricing = settings.pricing;
  if (!pricing || typeof pricing !== "object") {
    return NextResponse.json({ error: "Harga paket tidak valid." }, { status: 400 });
  }
  const priceValues = [pricing.proMonthly, pricing.proYearly, pricing.businessMonthly, pricing.businessYearly];
  if (priceValues.length !== 4 || priceValues.some((value) => !Number.isInteger(value) || value < 0 || value > 100_000_000)) {
    return NextResponse.json({ error: "Harga paket harus berupa angka antara 0 dan 100 juta." }, { status: 400 });
  }

  const normalized: SiteSettings = {
    heroBadge: settings.heroBadge.trim().slice(0, 100),
    heroTitle: settings.heroTitle.trim().slice(0, 100),
    heroAccent: settings.heroAccent.trim().slice(0, 100),
    heroDescription: settings.heroDescription.trim().slice(0, 300),
    salesWhatsapp: settings.salesWhatsapp.replace(/\D/g, "").slice(0, 15),
    pricing: {
      proMonthly: pricing.proMonthly,
      proYearly: pricing.proYearly,
      businessMonthly: pricing.businessMonthly,
      businessYearly: pricing.businessYearly,
    },
  };

  const admin = createAdminClient();
  const { error } = await admin.from("site_settings").upsert({
    key: "public",
    value: normalized,
    updated_at: new Date().toISOString(),
  }, { onConflict: "key" });

  if (error) {
    console.error("Failed to save site settings", error.message);
    return NextResponse.json({ error: "Gagal menyimpan. Pastikan migrasi pengaturan admin sudah diterapkan." }, { status: 500 });
  }

  return NextResponse.json({ settings: normalized });
}
