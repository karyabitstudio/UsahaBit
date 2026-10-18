import { createClient } from "@/lib/supabase/server";
import { TeamManagement } from "@/components/team/TeamManagement";

export default async function TeamPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  return <TeamManagement />;
}
