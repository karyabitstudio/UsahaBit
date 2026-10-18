import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { isAdminEmail } from "@/lib/admin-auth";
import { getEffectivePlan } from "@/lib/plan";
import { resolveWorkspaceOwnerId, getWorkspaceProfile } from "@/lib/workspace";

export const instant = false;

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const workspaceId = await resolveWorkspaceOwnerId(supabase, user.id);
  const profile = await getWorkspaceProfile(workspaceId);
  const isAdmin = isAdminEmail(user.email);
  const isBusiness = isAdmin || getEffectivePlan(profile?.plan, profile?.plan_expires_at || null) === "business";
  const accessProfile = {
    ...profile,
    plan: isBusiness ? "business" : getEffectivePlan(profile?.plan, profile?.plan_expires_at || null),
  };

  return (
    <div className="min-h-screen md:flex">
      <Sidebar profile={accessProfile} isAdmin={isBusiness} />
      <main className="min-w-0 flex-1 p-3 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
