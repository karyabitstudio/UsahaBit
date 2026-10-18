import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin-auth";
import { AdminClickStats } from "@/components/admin/AdminClickStats";

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  if (!isAdminEmail(user.email)) redirect("/");
  return <AdminClickStats />;
}
