import { createClient } from "@/lib/supabase/server";
import { getPlanLimits, isPlanActive, Plan } from "@/lib/plan";

export async function checkInvoiceLimit(userId: string) {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("plan, plan_expires_at")
    .eq("id", userId)
    .single();

  const plan = (profile?.plan || "free") as Plan;
  const isActive =
    plan === "free" ? true : isPlanActive(profile?.plan_expires_at);
  const effectivePlan = isActive ? plan : "free";

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
    .eq("user_id", userId)
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
