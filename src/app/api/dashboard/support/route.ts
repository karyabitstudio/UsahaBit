import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin-auth";
import { getEffectivePlan } from "@/lib/plan";
import { sendSupportTicketEmail } from "@/lib/support-email";

async function context() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { response: NextResponse.json({ error: "Silakan masuk kembali." }, { status: 401 }) };
  const ownerId = user.id;
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("plan, plan_expires_at").eq("id", ownerId).maybeSingle();
  const plan = isAdminEmail(user.email) ? "business" : getEffectivePlan(profile?.plan, profile?.plan_expires_at || null);
  return { supabase, admin, ownerId, plan, userEmail: user.email };
}

export async function GET() {
  const result = await context();
  if ("response" in result) return result.response;
  const { data, error } = await result.admin.from("support_tickets").select("id, subject, message, plan, priority, status, admin_reply, created_at, updated_at").eq("user_id", result.ownerId).order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: "Riwayat support gagal dimuat. Pastikan tabel support_tickets tersedia di Supabase." }, { status: 500 });
  return NextResponse.json({ tickets: data || [], plan: result.plan });
}

export async function POST(request: Request) {
  const result = await context();
  if ("response" in result) return result.response;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Pesan support tidak valid." }, { status: 400 }); }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Pesan support tidak valid." }, { status: 400 });
  const input = body as { subject?: unknown; message?: unknown };
  const subject = typeof input.subject === "string" ? input.subject.trim() : "";
  const message = typeof input.message === "string" ? input.message.trim() : "";
  if (!subject || subject.length > 140 || !message || message.length > 5000) return NextResponse.json({ error: "Subjek wajib diisi (maksimal 140 karakter) dan pesan maksimal 5.000 karakter." }, { status: 400 });
  const priority = result.plan === "business" ? "business" : result.plan === "pro" ? "priority" : "normal";
  const { data, error } = await result.admin.from("support_tickets").insert({ user_id: result.ownerId, subject, message, plan: result.plan, priority }).select("id, subject, message, plan, priority, status, admin_reply, created_at, updated_at").single();
  if (error) {
    console.error("Failed to create support ticket:", error.message);
    return NextResponse.json({ error: "Tiket support gagal disimpan. Pastikan migrasi support sudah diterapkan." }, { status: 500 });
  }
  let notificationWarning: string | undefined;
  try {
    await sendSupportTicketEmail({
      subject: data.subject,
      message: data.message,
      userEmail: result.userEmail,
      plan: data.plan,
      priority: data.priority,
      createdAt: data.created_at,
    });
  } catch (emailError) {
    console.error("Failed to email admins about a support ticket:", emailError);
    notificationWarning = "Tiket tersimpan, tetapi email notifikasi ke admin gagal dikirim.";
  }
  return NextResponse.json({ ticket: data, notificationWarning }, { status: 201 });
}
