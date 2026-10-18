import { createAdminClient } from "@/lib/supabase/admin";

export async function getAccountProfile(userId: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("*").eq("id", userId).maybeSingle();
  return data;
}
