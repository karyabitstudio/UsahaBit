import { createAdminClient } from "@/lib/supabase/admin";

export async function resolveWorkspaceOwnerId(_supabase: any, userId: string) {
  // Resolve through the server-only client so workspace lookup is not affected
  // by a member's own profile or by a stale/missing select policy.
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("workspace_members")
    .select("owner_id")
    .eq("member_user_id", userId)
    .eq("status", "active")
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) {
    console.error("Failed to resolve workspace owner", error.message);
    return userId;
  }
  return data?.[0]?.owner_id || userId;
}

export async function getWorkspaceProfile(ownerId: string) {
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("*").eq("id", ownerId).maybeSingle();
  return data;
}
