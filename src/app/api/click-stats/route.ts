import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin-auth";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(null, { status: 204 });
  }
  if (!body || typeof body !== "object") return new Response(null, { status: 204 });

  const { path, label } = body as { path?: unknown; label?: unknown };
  if (typeof path !== "string" || typeof label !== "string") return new Response(null, { status: 204 });
  const cleanPath = path.trim().slice(0, 160);
  const cleanLabel = label.replace(/\s+/g, " ").trim().slice(0, 80);
  if (!cleanPath.startsWith("/") || cleanPath.startsWith("/admin") || cleanPath.startsWith("/dashboard") || cleanPath.startsWith("/api") || !cleanLabel) {
    return new Response(null, { status: 204 });
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.rpc("increment_click_stat", { p_path: cleanPath, p_label: cleanLabel });
    if (error) console.error("Failed to record click statistic", error.message);
  } catch (error) {
    console.error("Click statistics are unavailable", error);
  }
  return new Response(null, { status: 204 });
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan masuk sebagai admin." }, { status: 401 });
  if (!isAdminEmail(user.email)) return NextResponse.json({ error: "Akses admin ditolak." }, { status: 403 });

  const admin = createAdminClient();
  const { data, error } = await admin.from("click_stats").select("path, label, click_count, updated_at").order("click_count", { ascending: false });
  if (error) {
    console.error("Failed to load click statistics", error.message);
    return NextResponse.json({ error: "Statistik klik belum tersedia. Terapkan migrasi Supabase terbaru." }, { status: 500 });
  }
  return NextResponse.json({ items: data || [] });
}
