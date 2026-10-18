import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/admin-auth";
import { AdminSupportInbox } from "@/components/admin/AdminSupportInbox";

export default async function AdminSupportPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");
  if (!isAdminEmail(user.email)) redirect("/");
  return <AdminSupportInbox />;
}
