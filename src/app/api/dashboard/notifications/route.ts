import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan masuk kembali." }, { status: 401 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("workspace_notifications")
    .select("id, kind, workspace_name, created_at")
    .eq("user_id", user.id)
    .is("read_at", null)
    .order("created_at", { ascending: false })
    .limit(5);
  if (error) return NextResponse.json({ error: "Notifikasi gagal dimuat." }, { status: 500 });
  return NextResponse.json({ notifications: data || [] });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan masuk kembali." }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Notifikasi tidak valid." }, { status: 400 }); }
  const id = body && typeof body === "object" && "id" in body && typeof body.id === "string" ? body.id : "";
  if (!id) return NextResponse.json({ error: "Notifikasi tidak valid." }, { status: 400 });

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("workspace_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .is("read_at", null)
    .select("id")
    .maybeSingle();
  if (error) return NextResponse.json({ error: "Notifikasi gagal ditutup." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Notifikasi tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ success: true });
}
