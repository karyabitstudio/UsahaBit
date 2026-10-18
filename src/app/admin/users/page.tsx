import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminUsersPanel } from "@/components/admin/AdminUsersPanel";
import { isAdminEmail } from "@/lib/admin-auth";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  if (!isAdminEmail(user.email)) redirect("/");

  return <AdminUsersPanel />;
}
