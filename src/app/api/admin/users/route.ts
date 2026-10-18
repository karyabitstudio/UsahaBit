import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin-auth";

const PAGE_SIZE = 50;
const plans = ["free", "pro", "business"] as const;
const periods = ["monthly", "yearly"] as const;

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { response: NextResponse.json({ error: "Silakan masuk sebagai admin." }, { status: 401 }) };
  if (!isAdminEmail(user.email)) return { response: NextResponse.json({ error: "Akses admin ditolak." }, { status: 403 }) };
  return { user };
}

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  const url = new URL(request.url);
  const page = Math.max(1, Math.min(10000, Number(url.searchParams.get("page")) || 1));
  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: PAGE_SIZE });
  if (error) {
    console.error("Failed to list admin users", error.message);
    return NextResponse.json({ error: "Daftar pengguna gagal dimuat." }, { status: 500 });
  }

  const ids = data.users.map((user) => user.id);
  const { data: profiles, error: profilesError } = ids.length
    ? await admin.from("profiles").select("id, full_name, business_name, plan, plan_expires_at").in("id", ids)
    : { data: [], error: null };
  if (profilesError) {
    console.error("Failed to load admin user profiles", profilesError.message);
    return NextResponse.json({ error: "Data profil pengguna gagal dimuat." }, { status: 500 });
  }

  const byId = new Map((profiles || []).map((profile) => [profile.id, profile]));
  return NextResponse.json({
    users: data.users.map((user) => {
      const profile = byId.get(user.id);
      return {
        id: user.id,
        email: user.email || "(tanpa email)",
        fullName: profile?.full_name || "",
        businessName: profile?.business_name || "",
        plan: profile?.plan || "free",
        planExpiresAt: profile?.plan_expires_at || null,
        isPlanActive: profile?.plan === "pro" || profile?.plan === "business"
          ? Boolean(profile.plan_expires_at && new Date(profile.plan_expires_at) > new Date())
          : true,
      };
    }),
    page,
    hasNextPage: data.users.length === PAGE_SIZE,
  });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Data paket tidak valid." }, { status: 400 });
  }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Data paket tidak valid." }, { status: 400 });
  const { userId, plan, period } = body as { userId?: unknown; plan?: unknown; period?: unknown };
  if (typeof userId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(userId)) {
    return NextResponse.json({ error: "Pengguna tidak valid." }, { status: 400 });
  }
  if (!plans.includes(plan as (typeof plans)[number])) return NextResponse.json({ error: "Paket tidak valid." }, { status: 400 });
  if (plan !== "free" && !periods.includes(period as (typeof periods)[number])) {
    return NextResponse.json({ error: "Pilih masa aktif bulanan atau tahunan." }, { status: 400 });
  }

  const admin = createAdminClient();
  let expiresAt: string | null = null;
  if (plan !== "free") {
    const { data: current, error: currentError } = await admin
      .from("profiles")
      .select("plan, plan_expires_at")
      .eq("id", userId)
      .maybeSingle();
    if (currentError) {
      console.error("Failed to read user package", currentError.message);
      return NextResponse.json({ error: "Paket pengguna gagal dibaca." }, { status: 500 });
    }
    const now = new Date();
    const currentExpiry = current?.plan === plan && current.plan_expires_at
      ? new Date(current.plan_expires_at)
      : null;
    const start = currentExpiry && currentExpiry > now ? currentExpiry : now;
    const expiry = new Date(start);
    if (period === "yearly") expiry.setUTCFullYear(expiry.getUTCFullYear() + 1);
    else expiry.setUTCMonth(expiry.getUTCMonth() + 1);
    expiresAt = expiry.toISOString();
  }

  const { data, error } = await admin
    .from("profiles")
    .update({ plan, plan_expires_at: expiresAt, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select("id, plan, plan_expires_at")
    .maybeSingle();
  if (error) {
    console.error("Failed to update user package", error.message);
    return NextResponse.json({ error: "Paket gagal diperbarui." }, { status: 500 });
  }
  if (!data) return NextResponse.json({ error: "Profil pengguna belum tersedia." }, { status: 404 });
  return NextResponse.json({ user: data });
}
