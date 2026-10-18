import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DEFAULT_SITE_SETTINGS, type SiteSettings } from "@/lib/site-settings";
import { AdminSettingsForm } from "@/components/admin/AdminSettingsForm";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  if (!user.email || !adminEmails.includes(user.email.toLowerCase())) redirect("/");

  const { data } = await supabase
    .from("site_settings")
    .select("value")
    .eq("key", "public")
    .maybeSingle();
  const saved = data?.value as Partial<SiteSettings> | undefined;
  const settings: SiteSettings = {
    ...DEFAULT_SITE_SETTINGS,
    ...saved,
    salesWhatsapp: saved?.salesWhatsapp || DEFAULT_SITE_SETTINGS.salesWhatsapp,
    pricing: { ...DEFAULT_SITE_SETTINGS.pricing, ...saved?.pricing },
  };

  return <AdminSettingsForm initialSettings={settings} />;
}
