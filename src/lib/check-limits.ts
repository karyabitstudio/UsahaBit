import { createClient } from "@/lib/supabase/server";
import { getEffectivePlan, getPlanLimits } from "@/lib/plan";
import { isAdminEmail } from "@/lib/admin-auth";
import { resolveWorkspaceOwnerId, getWorkspaceProfile } from "@/lib/workspace";

export async function checkInvoiceLimit(userId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const workspaceId = user?.id === userId ? await resolveWorkspaceOwnerId(supabase, userId) : userId;
  const profile = await getWorkspaceProfile(workspaceId);

  const isAdmin = user?.id === userId && isAdminEmail(user.email);
  const effectivePlan = isAdmin
    ? "business"
    : getEffectivePlan(profile?.plan, profile?.plan_expires_at || null);

  const limits = getPlanLimits(effectivePlan);

  if (limits.maxInvoicesPerMonth === Infinity) {
    return { allowed: true, remaining: Infinity, plan: effectivePlan };
  }

  // Hitung invoice bulan ini
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true })
    .eq("user_id", workspaceId)
    .gte("created_at", startOfMonth.toISOString());

  const used = count || 0;
  const remaining = limits.maxInvoicesPerMonth - used;

  return {
    allowed: remaining > 0,
    remaining: Math.max(0, remaining),
    used,
    limit: limits.maxInvoicesPerMonth,
    plan: effectivePlan,
  };
}
