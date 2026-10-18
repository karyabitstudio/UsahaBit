import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { getEffectivePlan } from "@/lib/plan";
import { isAdminEmail } from "@/lib/admin-auth";
import { getAccountProfile } from "@/lib/account";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const accountId = user!.id;
  const profile = await getAccountProfile(accountId);

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
