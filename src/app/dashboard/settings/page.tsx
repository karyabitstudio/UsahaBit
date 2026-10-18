import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { getEffectivePlan } from "@/lib/plan";
import { isAdminEmail } from "@/lib/admin-auth";
import { resolveWorkspaceOwnerId, getWorkspaceProfile } from "@/lib/workspace";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const workspaceId = await resolveWorkspaceOwnerId(supabase, user!.id);
  if (workspaceId !== user!.id) {
    return <div className="max-w-2xl rounded-2xl border bg-card p-6"><h1 className="text-xl font-bold">Pengaturan workspace</h1><p className="mt-2 text-sm text-muted-foreground">Profil dan branding usaha dikelola oleh pemilik workspace.</p></div>;
  }
  const profile = await getWorkspaceProfile(workspaceId);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Pengaturan</h1>
        <p className="text-muted-foreground">
          Kelola profil bisnis dan branding untuk invoice
        </p>
      </div>

      <SettingsForm profile={profile} canUseCustomBranding={isAdminEmail(user?.email) || getEffectivePlan(profile?.plan, profile?.plan_expires_at || null) !== "free"} />
    </div>
  );
}
