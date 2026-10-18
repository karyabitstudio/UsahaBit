import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin-auth";
import { getEffectivePlan } from "@/lib/plan";

async function authContext() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { response: NextResponse.json({ error: "Silakan masuk kembali." }, { status: 401 }) };
  const admin = createAdminClient();
  const { data: membership } = await admin.from("workspace_members").select("owner_id").eq("member_user_id", user.id).eq("status", "active").maybeSingle();
  const ownerId = membership?.owner_id || user.id;
  const { data: ownerProfile } = await admin.from("profiles").select("plan, plan_expires_at").eq("id", ownerId).maybeSingle();
  const plan = isAdminEmail(user.email) ? "business" : getEffectivePlan(ownerProfile?.plan, ownerProfile?.plan_expires_at || null);
  return { user, admin, ownerId, plan, isOwner: ownerId === user.id };
}

export async function GET() {
  const context = await authContext();
  if ("response" in context) return context.response;
  const { admin, ownerId, isOwner, plan } = context;
  const { data, error } = await admin.from("workspace_members").select("id, invited_email, member_user_id, status, created_at").eq("owner_id", ownerId).order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: "Anggota tim gagal dimuat. Pastikan migrasi workspace sudah diterapkan." }, { status: 500 });
  return NextResponse.json({ members: data || [], isOwner, canManage: isOwner && plan === "business", plan, seatLimit: 5, seatsUsed: 1 + (data || []).filter((item) => item.status === "active" || item.status === "pending").length });
}

export async function POST(request: Request) {
  const context = await authContext();
  if ("response" in context) return context.response;
  const { admin, user, ownerId, isOwner, plan } = context;
  if (!isOwner || plan !== "business") return NextResponse.json({ error: "Undangan anggota tim tersedia untuk pemilik paket Business yang aktif." }, { status: 403 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Email undangan tidak valid." }, { status: 400 }); }
  const email = body && typeof body === "object" && "email" in body && typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) return NextResponse.json({ error: "Masukkan email yang valid." }, { status: 400 });
  if (email === user.email?.toLowerCase()) return NextResponse.json({ error: "Pemilik sudah termasuk dalam lima kursi tim." }, { status: 400 });

  const { data: existingMembers, error: listError } = await admin.from("workspace_members").select("id, invited_email, member_user_id, status").eq("owner_id", ownerId);
  if (listError) return NextResponse.json({ error: "Kapasitas tim gagal diperiksa." }, { status: 500 });
  const activeSeats = (existingMembers || []).filter((item) => item.status === "active" || item.status === "pending").length;
  const existingInvite = (existingMembers || []).find((item) => item.invited_email.toLowerCase() === email);
  if (activeSeats >= 4 && !existingInvite) return NextResponse.json({ error: "Paket Business mencakup maksimal lima orang termasuk pemilik." }, { status: 409 });
  if (existingInvite?.status === "active") return NextResponse.json({ error: "Email ini sudah menjadi anggota tim." }, { status: 409 });
  const { data: pendingElsewhere } = await admin.from("workspace_members").select("id").eq("invited_email", email).eq("status", "pending").maybeSingle();
  if (pendingElsewhere && pendingElsewhere.id !== existingInvite?.id) return NextResponse.json({ error: "Email ini sudah menunggu undangan dari workspace lain." }, { status: 409 });

  let existingAuthUser: { id: string } | null = null;
  for (let page = 1; page <= 20 && !existingAuthUser; page += 1) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) return NextResponse.json({ error: "Akun undangan gagal diperiksa." }, { status: 500 });
    const found = data.users.find((item) => item.email?.toLowerCase() === email);
    if (found) existingAuthUser = { id: found.id };
    if (data.users.length < 1000) break;
  }
  if (existingAuthUser) {
    const { data: alreadyOnTeam } = await admin.from("workspace_members").select("id").eq("member_user_id", existingAuthUser.id).eq("status", "active").maybeSingle();
    if (alreadyOnTeam) return NextResponse.json({ error: "Akun tersebut sudah menjadi anggota tim lain." }, { status: 409 });
  }

  let member = existingInvite || null;
  if (existingAuthUser && existingInvite) {
    const { data, error } = await admin.from("workspace_members").update({ member_user_id: existingAuthUser.id, status: "active" }).eq("id", existingInvite.id).select("id, invited_email, member_user_id, status, created_at").single();
    if (error) return NextResponse.json({ error: "Anggota gagal diaktifkan." }, { status: 500 });
    member = data;
  } else if (!existingInvite) {
    const { data, error } = await admin.from("workspace_members").insert({ owner_id: ownerId, invited_email: email, member_user_id: existingAuthUser?.id || null, status: existingAuthUser ? "active" : "pending" }).select("id, invited_email, member_user_id, status, created_at").single();
    if (error) return NextResponse.json({ error: "Undangan gagal disimpan." }, { status: 500 });
    member = data;
  }

  if (!existingAuthUser) {
    const origin = new URL(request.url).origin;
    const { error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo: `${origin}/auth/accept-invite` });
    if (inviteError) {
      if (!existingInvite && member) await admin.from("workspace_members").delete().eq("id", member.id);
      console.error("Failed to send team invitation", inviteError.message);
      return NextResponse.json({ error: `Email undangan gagal dikirim: ${inviteError.message}` }, { status: 502 });
    }
  }
  return NextResponse.json({ member, seatsUsed: activeSeats + (existingInvite ? 1 : 2) }, { status: existingInvite ? 200 : 201 });
}

export async function DELETE(request: Request) {
  const context = await authContext();
  if ("response" in context) return context.response;
  if (!context.isOwner || context.plan !== "business") return NextResponse.json({ error: "Hanya pemilik Business yang dapat mengatur anggota." }, { status: 403 });
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Anggota tidak valid." }, { status: 400 }); }
  const memberId = body && typeof body === "object" && "memberId" in body && typeof body.memberId === "string" ? body.memberId : "";
  if (!memberId) return NextResponse.json({ error: "Anggota tidak valid." }, { status: 400 });

  const { data: member, error: lookupError } = await context.admin
    .from("workspace_members")
    .select("id, member_user_id, invited_email")
    .eq("id", memberId)
    .eq("owner_id", context.ownerId)
    .maybeSingle();
  if (lookupError) return NextResponse.json({ error: "Anggota gagal diperiksa." }, { status: 500 });
  if (!member) return NextResponse.json({ error: "Anggota tidak ditemukan." }, { status: 404 });

  let notificationId: string | null = null;
  if (member.member_user_id) {
    const { data: ownerProfile } = await context.admin.from("profiles").select("business_name").eq("id", context.ownerId).maybeSingle();
    const { data: notification, error: notificationError } = await context.admin
      .from("workspace_notifications")
      .insert({ user_id: member.member_user_id, kind: "removed_from_workspace", workspace_name: ownerProfile?.business_name || "workspace" })
      .select("id")
      .single();
    if (notificationError) {
      console.error("Failed to notify removed workspace member", notificationError.message);
      return NextResponse.json({ error: "Notifikasi anggota gagal disiapkan. Pastikan migrasi notifikasi workspace sudah diterapkan." }, { status: 500 });
    }
    notificationId = notification.id;
  }

  const { error, count } = await context.admin.from("workspace_members").delete({ count: "exact" }).eq("id", memberId).eq("owner_id", context.ownerId);
  if (error || !count) {
    if (notificationId) await context.admin.from("workspace_notifications").delete().eq("id", notificationId);
    if (error) return NextResponse.json({ error: "Anggota gagal dikeluarkan." }, { status: 500 });
    return NextResponse.json({ error: "Anggota tidak ditemukan." }, { status: 404 });
  }
  return NextResponse.json({ success: true, notified: Boolean(notificationId) });
}
