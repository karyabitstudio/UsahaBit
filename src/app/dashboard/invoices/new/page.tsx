import { createClient } from "@/lib/supabase/server";
import { InvoiceForm } from "../InvoiceForm";
import { getEffectivePlan } from "@/lib/plan";
import { isAdminEmail } from "@/lib/admin-auth";
import { getAccountProfile } from "@/lib/account";

export default async function NewInvoicePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const accountId = user!.id;

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name")
    .eq("user_id", accountId)
    .order("name");
  const profile = await getAccountProfile(accountId);
  const canUseAllTemplates = isAdminEmail(user?.email) || getEffectivePlan(profile?.plan, profile?.plan_expires_at || null) !== "free";
  const { data: products } = canUseAllTemplates ? await supabase.from("catalog_products").select("id, name, description, price").eq("user_id", accountId).order("name") : { data: [] };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Buat Invoice</h1>
        <p className="text-muted-foreground">Isi detail invoice baru</p>
      </div>
      <InvoiceForm clients={clients || []} accountId={accountId} products={products || []} canUseAllTemplates={canUseAllTemplates} />
    </div>
  );
}
