import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { WorkspaceRemovalNotice } from "@/components/dashboard/WorkspaceRemovalNotice";
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
  const effectivePlan = getEffectivePlan(profile?.plan, profile?.plan_expires_at || null);
  const accessProfile = {
    ...profile,
    plan: isAdmin ? "business" : effectivePlan,
  };

  return (
    <div className="min-h-screen md:flex">
      <Sidebar profile={accessProfile} isAdmin={isAdmin} />
      <main className="min-w-0 flex-1 p-3 sm:p-6 lg:p-8">
        <WorkspaceRemovalNotice />
        {children}
      </main>
    </div>
  );
}
