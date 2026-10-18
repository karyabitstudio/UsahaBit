import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/dashboard/Sidebar";

export default async function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("business_name").eq("id", user.id).maybeSingle()
    : { data: null };

  return (
    <div className="min-h-screen md:flex">
      <Sidebar profile={profile} />
      <main className="min-w-0 flex-1 p-3 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
