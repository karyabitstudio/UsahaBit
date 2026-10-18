import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin-auth";
import { getEffectivePlan, getPlanLimits } from "@/lib/plan";
import { getWorkspaceProfile, resolveWorkspaceOwnerId } from "@/lib/workspace";

const freeTemplates = ["quotation", "work_order", "receipt"];
const allTemplates = [...freeTemplates, "task_letter", "completion_report", "payment_notice"];

async function getUserAndPlan() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { response: NextResponse.json({ error: "Silakan masuk kembali." }, { status: 401 }) };
  const ownerId = await resolveWorkspaceOwnerId(supabase, user.id);
  const profile = await getWorkspaceProfile(ownerId);
  const isAdmin = isAdminEmail(user.email);
  const plan = isAdmin ? "business" : getEffectivePlan(profile?.plan, profile?.plan_expires_at || null);
  return { supabase, user, ownerId, plan, isAdmin };
}

export async function GET() {
  const context = await getUserAndPlan();
  if ("response" in context) return context.response;
  const { supabase, user, ownerId, plan } = context;
  const { data: documents, error } = await supabase
    .from("business_documents")
    .select("id, template, title, recipient, body, amount, created_at")
    .eq("user_id", ownerId)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) {
    console.error("Failed to load business documents", error.message);
    return NextResponse.json({ error: "Surat belum tersedia. Pastikan migrasi dokumen sudah diterapkan." }, { status: 500 });
  }
  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const { count } = await supabase.from("business_documents").select("id", { count: "exact", head: true }).eq("user_id", ownerId).gte("created_at", start.toISOString());
  const documentLimit = getPlanLimits(plan).maxDocuments;
  return NextResponse.json({ documents: documents || [], used: count || 0, limit: Number.isFinite(documentLimit) ? documentLimit : null });
}

export async function POST(request: Request) {
  const context = await getUserAndPlan();
  if ("response" in context) return context.response;
  const { supabase, user, ownerId, plan } = context;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Data surat tidak valid." }, { status: 400 });
  }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Data surat tidak valid." }, { status: 400 });
  const input = body as { template?: unknown; title?: unknown; recipient?: unknown; body?: unknown; amount?: unknown };
  if (typeof input.template !== "string" || !allTemplates.includes(input.template)) return NextResponse.json({ error: "Template surat tidak valid." }, { status: 400 });
  if (plan === "free" && !freeTemplates.includes(input.template)) return NextResponse.json({ error: "Template ini tersedia di paket Pro dan Business." }, { status: 403 });
  if (typeof input.title !== "string" || !input.title.trim() || input.title.length > 120) return NextResponse.json({ error: "Judul surat wajib diisi (maksimal 120 karakter)." }, { status: 400 });
  if (typeof input.recipient !== "string" || input.recipient.length > 160) return NextResponse.json({ error: "Nama penerima tidak valid." }, { status: 400 });
  if (typeof input.body !== "string" || !input.body.trim() || input.body.length > 10000) return NextResponse.json({ error: "Isi surat wajib diisi (maksimal 10.000 karakter)." }, { status: 400 });
  const amount = input.amount === undefined || input.amount === "" ? null : Number(input.amount);
  if (amount !== null && (!Number.isFinite(amount) || amount < 0 || amount > 1_000_000_000_000)) return NextResponse.json({ error: "Nominal tidak valid." }, { status: 400 });

  const start = new Date();
  start.setDate(1);
  start.setHours(0, 0, 0, 0);
  const { count, error: countError } = await supabase.from("business_documents").select("id", { count: "exact", head: true }).eq("user_id", ownerId).gte("created_at", start.toISOString());
  if (countError) return NextResponse.json({ error: "Batas surat gagal diperiksa." }, { status: 500 });
  const limits = getPlanLimits(plan);
  if (count !== null && count !== undefined && count >= limits.maxDocuments) {
    return NextResponse.json({ error: "Batas surat gratis bulan ini sudah habis. Pilih paket untuk melanjutkan." }, { status: 403 });
  }

  const { data, error } = await supabase.from("business_documents").insert({
    user_id: ownerId,
    template: input.template,
    title: input.title.trim(),
    recipient: input.recipient.trim(),
    body: input.body.trim(),
    amount,
  }).select("id, template, title, recipient, body, amount, created_at").single();
  if (error) {
    console.error("Failed to save business document", error.message);
    return NextResponse.json({ error: "Surat gagal disimpan." }, { status: 500 });
  }
  return NextResponse.json({ document: data, used: (count || 0) + 1, limit: Number.isFinite(limits.maxDocuments) ? limits.maxDocuments : null }, { status: 201 });
}

export async function PATCH(request: Request) {
  const context = await getUserAndPlan();
  if ("response" in context) return context.response;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Data surat tidak valid." }, { status: 400 }); }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Data surat tidak valid." }, { status: 400 });
  const input = body as { id?: unknown; template?: unknown; title?: unknown; recipient?: unknown; body?: unknown; amount?: unknown };
  if (typeof input.id !== "string" || typeof input.template !== "string" || !allTemplates.includes(input.template)) return NextResponse.json({ error: "Surat atau template tidak valid." }, { status: 400 });
  if (context.plan === "free" && !freeTemplates.includes(input.template)) return NextResponse.json({ error: "Template ini tersedia di paket Pro dan Business." }, { status: 403 });
  if (typeof input.title !== "string" || !input.title.trim() || input.title.length > 120 || typeof input.recipient !== "string" || input.recipient.length > 160 || typeof input.body !== "string" || !input.body.trim() || input.body.length > 10000) return NextResponse.json({ error: "Periksa judul, penerima, dan isi surat." }, { status: 400 });
  const amount = input.amount === undefined || input.amount === "" ? null : Number(input.amount);
  if (amount !== null && (!Number.isFinite(amount) || amount < 0 || amount > 1_000_000_000_000)) return NextResponse.json({ error: "Nominal tidak valid." }, { status: 400 });
  const admin = createAdminClient();
  const { data, error } = await admin.from("business_documents").update({ template: input.template, title: input.title.trim(), recipient: input.recipient.trim(), body: input.body.trim(), amount }).eq("id", input.id).eq("user_id", context.ownerId).select("id, template, title, recipient, body, amount, created_at").maybeSingle();
  if (error) return NextResponse.json({ error: "Surat gagal diperbarui." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Surat tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ document: data });
}

export async function DELETE(request: Request) {
  const context = await getUserAndPlan();
  if ("response" in context) return context.response;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Surat tidak valid." }, { status: 400 }); }
  const id = body && typeof body === "object" && "id" in body && typeof body.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "Surat tidak valid." }, { status: 400 });
  const admin = createAdminClient();
  const { data, error } = await admin.from("business_documents").delete().eq("id", id).eq("user_id", context.ownerId).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: "Surat gagal dihapus." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Surat tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ success: true });
}
