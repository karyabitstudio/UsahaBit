import { ClientForm } from "../ClientForm";
import { createClient } from "@/lib/supabase/server";
import { resolveWorkspaceOwnerId } from "@/lib/workspace";

export default async function NewClientPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const workspaceId = await resolveWorkspaceOwnerId(supabase, user!.id);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Tambah Client</h1>
        <p className="text-muted-foreground">Isi data client baru</p>
      </div>
      <ClientForm workspaceId={workspaceId} />
    </div>
  );
}
