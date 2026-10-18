import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Silakan masuk dengan email yang menerima undangan." }, { status: 401 });

  const admin = createAdminClient();
  const { data: invite, error: lookupError } = await admin.from("workspace_members").select("id").eq("invited_email", user.email.toLowerCase()).eq("status", "pending").maybeSingle();
  if (lookupError) return NextResponse.json({ error: "Undangan gagal diperiksa. Silakan coba lagi." }, { status: 500 });
  if (!invite) {
    const { data: activeMembership } = await admin.from("workspace_members").select("id").eq("member_user_id", user.id).eq("status", "active").maybeSingle();
    if (activeMembership) return NextResponse.json({ success: true, alreadyAccepted: true });
    return NextResponse.json({ error: "Undangan untuk email ini tidak ditemukan atau sudah kedaluwarsa." }, { status: 404 });
  }

  const { error: updateError } = await admin.from("workspace_members").update({ member_user_id: user.id, status: "active" }).eq("id", invite.id).eq("status", "pending").select("id").single();
  if (updateError) return NextResponse.json({ error: "Akun sudah terhubung ke workspace lain atau undangan gagal diaktifkan." }, { status: 409 });
  return NextResponse.json({ success: true });
}
