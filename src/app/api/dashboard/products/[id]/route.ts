import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin-auth";
import { getEffectivePlan, getPlanLimits } from "@/lib/plan";
import { createAdminClient } from "@/lib/supabase/admin";

async function getContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { response: NextResponse.json({ error: "Silakan masuk kembali." }, { status: 401 }) };
  const ownerId = user.id;
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("plan, plan_expires_at").eq("id", ownerId).maybeSingle();
  const plan = isAdminEmail(user.email) ? "business" : getEffectivePlan(profile?.plan, profile?.plan_expires_at || null);
  if (!getPlanLimits(plan).allowCatalog) return { response: NextResponse.json({ error: "Katalog produk tersedia di paket Pro dan Business." }, { status: 403 }) };
  return { supabase, ownerId };
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await getContext();
  if ("response" in context) return context.response;
  const { id } = await params;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Data produk tidak valid." }, { status: 400 }); }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Data produk tidak valid." }, { status: 400 });
  const input = body as { name?: unknown; description?: unknown; price?: unknown };
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const description = typeof input.description === "string" ? input.description.trim() : "";
  const price = Number(input.price);
  if (!name || name.length > 120 || description.length > 500 || !Number.isFinite(price) || price < 0 || price > 999_999_999_999) return NextResponse.json({ error: "Data produk tidak valid." }, { status: 400 });
  const { data, error } = await context.supabase.from("catalog_products").update({ name, description, price, updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", context.ownerId).select("id, name, description, price, created_at").maybeSingle();
  if (error) return NextResponse.json({ error: "Produk gagal diperbarui." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ product: data });
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const context = await getContext();
  if ("response" in context) return context.response;
  const { id } = await params;
  const { error, count } = await context.supabase.from("catalog_products").delete({ count: "exact" }).eq("id", id).eq("user_id", context.ownerId);
  if (error) return NextResponse.json({ error: "Produk gagal dihapus." }, { status: 500 });
  if (!count) return NextResponse.json({ error: "Produk tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ success: true });
}
