import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin-auth";

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { response: NextResponse.json({ error: "Silakan masuk sebagai admin." }, { status: 401 }) };
  if (!isAdminEmail(user.email)) return { response: NextResponse.json({ error: "Akses admin ditolak." }, { status: 403 }) };
  return {};
}

export async function GET() {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  const admin = createAdminClient();
  const { data, error } = await admin.from("support_tickets").select("id, user_id, subject, message, plan, priority, status, admin_reply, created_at, updated_at").order("created_at", { ascending: false }).limit(200);
  if (error) return NextResponse.json({ error: "Tiket support gagal dimuat. Pastikan migrasi workspace sudah diterapkan." }, { status: 500 });
  const tickets = await Promise.all((data || []).map(async (ticket) => {
    const { data: { user } } = await admin.auth.admin.getUserById(ticket.user_id);
    return { ...ticket, email: user?.email || "(tanpa email)" };
  }));
  const priorityOrder = { business: 0, priority: 1, normal: 2 };
  tickets.sort((a, b) => priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder] || new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  return NextResponse.json({ tickets });
}

export async function PATCH(request: Request) {
  const auth = await requireAdmin();
  if ("response" in auth) return auth.response;
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Perubahan tiket tidak valid." }, { status: 400 }); }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Perubahan tiket tidak valid." }, { status: 400 });
  const input = body as { id?: unknown; status?: unknown; reply?: unknown };
  const statuses = ["open", "in_progress", "answered", "closed"];
  if (typeof input.id !== "string" || !statuses.includes(String(input.status)) || typeof input.reply !== "string" || input.reply.length > 5000) return NextResponse.json({ error: "Status atau balasan tidak valid." }, { status: 400 });
  const admin = createAdminClient();
  const { data, error } = await admin.from("support_tickets").update({ status: input.status, admin_reply: input.reply.trim() || null, updated_at: new Date().toISOString() }).eq("id", input.id).select("id, status, admin_reply, updated_at").maybeSingle();
  if (error) return NextResponse.json({ error: "Tiket gagal diperbarui." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Tiket tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ ticket: data });
}
