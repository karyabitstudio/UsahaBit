import { createAdminClient } from "@/lib/supabase/admin";

export async function resolveWorkspaceOwnerId(_supabase: any, userId: string) {
  // Resolve through the server-only client so workspace lookup is not affected
  // by a member's own profile or by a stale/missing select policy.
  const admin = createAdminClient();
  const { data } = await admin
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
