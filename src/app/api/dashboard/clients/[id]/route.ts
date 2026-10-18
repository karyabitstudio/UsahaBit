import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Silakan masuk kembali." }, { status: 401 });
  const { id } = await params;
  const ownerId = user.id;
  const admin = createAdminClient();
  const { error: detachError } = await admin.from("invoices").update({ client_id: null }).eq("user_id", ownerId).eq("client_id", id);
  if (detachError) return NextResponse.json({ error: "Invoice terkait gagal diperbarui. Klien belum dihapus." }, { status: 500 });
  const { data, error } = await admin.from("clients").delete().eq("id", id).eq("user_id", ownerId).select("id").maybeSingle();
  if (error) return NextResponse.json({ error: "Klien gagal dihapus." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Klien tidak ditemukan." }, { status: 404 });
  return NextResponse.json({ success: true });
}
