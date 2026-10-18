import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin-auth";
import { getEffectivePlan } from "@/lib/plan";
import { DocumentsWorkspace } from "@/components/documents/DocumentsWorkspace";
import { getWorkspaceProfile, resolveWorkspaceOwnerId } from "@/lib/workspace";

export default async function DocumentsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const workspaceId = await resolveWorkspaceOwnerId(supabase, user!.id);
  const profile = await getWorkspaceProfile(workspaceId);
  const canUseAllTemplates = isAdminEmail(user?.email) || getEffectivePlan(profile?.plan, profile?.plan_expires_at || null) !== "free";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Surat Resmi</h1>
        <p className="text-muted-foreground">
          Buat SPK, surat penawaran, kwitansi, dan dokumen usaha lainnya
        </p>
      </div>

      <DocumentsWorkspace profile={profile} canUseAllTemplates={canUseAllTemplates} />
    </div>
  );
}
