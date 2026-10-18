import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { resolveWorkspaceOwnerId } from "@/lib/workspace";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan masuk kembali." }, { status: 401 });
  const { id } = await params;
  const ownerId = await resolveWorkspaceOwnerId(supabase, user.id);
  const { error, count } = await supabase.from("invoices").delete({ count: "exact" }).eq("id", id).eq("user_id", ownerId);
  if (error) return NextResponse.json({ error: "Invoice gagal dihapus. Pastikan item invoice terkait dapat ikut dihapus." }, { status: 500 });
  if (!count) return NextResponse.json({ error: "Invoice tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ success: true });
}
