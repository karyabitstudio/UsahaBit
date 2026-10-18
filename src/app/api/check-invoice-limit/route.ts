import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkInvoiceLimit } from "@/lib/check-limits";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await checkInvoiceLimit(user.id);
  return NextResponse.json(result);
}
