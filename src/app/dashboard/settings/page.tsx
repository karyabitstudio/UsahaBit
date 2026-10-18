import { createClient } from "@/lib/supabase/server";
import { SettingsForm } from "@/components/settings/SettingsForm";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Pengaturan</h1>
        <p className="text-muted-foreground">
          Kelola profil bisnis dan branding untuk invoice
        </p>
      </div>

      <SettingsForm profile={profile} />
    </div>
  );
}
