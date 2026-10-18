import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin-auth";
import { getEffectivePlan, getPlanLimits } from "@/lib/plan";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveWorkspaceOwnerId } from "@/lib/workspace";

async function getContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { response: NextResponse.json({ error: "Silakan masuk kembali." }, { status: 401 }) };
  const ownerId = await resolveWorkspaceOwnerId(supabase, user.id);
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("plan, plan_expires_at").eq("id", ownerId).maybeSingle();
  const plan = isAdminEmail(user.email) ? "business" : getEffectivePlan(profile?.plan, profile?.plan_expires_at || null);
  if (!getPlanLimits(plan).allowCatalog) return { response: NextResponse.json({ error: "Katalog produk tersedia di paket Pro dan Business." }, { status: 403 }) };
  return { supabase, user, ownerId };
}

export async function GET() {
  const context = await getContext();
  if ("response" in context) return context.response;
  const { supabase, ownerId } = context;
  const { data, error } = await supabase.from("catalog_products").select("id, name, description, price, created_at").eq("user_id", ownerId).order("name");
  if (error) {
    console.error("Failed to load product catalog", error.message);
    return NextResponse.json({ error: "Katalog produk gagal dimuat. Pastikan migrasi fitur Business sudah dijalankan." }, { status: 500 });
  }
  return NextResponse.json({ products: data || [] });
}

export async function POST(request: Request) {
  const context = await getContext();
  if ("response" in context) return context.response;
  const { supabase, ownerId } = context;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Data produk tidak valid." }, { status: 400 }); }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Data produk tidak valid." }, { status: 400 });
  const input = body as { name?: unknown; description?: unknown; price?: unknown };
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const description = typeof input.description === "string" ? input.description.trim() : "";
  const price = Number(input.price);
  if (!name || name.length > 120 || description.length > 500 || !Number.isFinite(price) || price < 0 || price > 999_999_999_999) {
    return NextResponse.json({ error: "Isi nama, deskripsi maksimal 500 karakter, dan harga yang valid." }, { status: 400 });
  }
  const { data, error } = await supabase.from("catalog_products").insert({ user_id: ownerId, name, description, price }).select("id, name, description, price, created_at").single();
  if (error) {
    console.error("Failed to create catalog product", error.message);
    return NextResponse.json({ error: "Produk gagal disimpan." }, { status: 500 });
  }
  return NextResponse.json({ product: data }, { status: 201 });
}
