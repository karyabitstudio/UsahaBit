import { createAdminClient } from "@/lib/supabase/admin";

export async function resolveWorkspaceOwnerId(supabase: any, userId: string) {
  const { data } = await supabase
    .from("workspace_members")
    .select("owner_id")
    .eq("member_user_id", userId)
    .eq("status", "active")
    .maybeSingle();
  return data?.owner_id || userId;
}

export async function getWorkspaceProfile(ownerId: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("*").eq("id", ownerId).maybeSingle();
  return data;
}
