import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdminEmail } from "@/lib/admin-auth";
import { getEffectivePlan, getPlanLimits } from "@/lib/plan";
import { ProductsWorkspace } from "@/components/products/ProductsWorkspace";
import { buttonVariants } from "@/components/ui/button";

export default async function ProductsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const ownerId = user.id;
  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("plan, plan_expires_at").eq("id", ownerId).maybeSingle();
  const plan = isAdminEmail(user.email) ? "business" : getEffectivePlan(profile?.plan, profile?.plan_expires_at || null);

  if (!getPlanLimits(plan).allowCatalog) {
    return <div className="mx-auto max-w-xl rounded-2xl border bg-card p-8 text-center"><h1 className="text-xl font-bold">Katalog Produk</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Simpan produk dan jasa agar bisa dimasukkan dengan cepat ke invoice. Fitur ini tersedia di paket Pro dan Business.</p><Link href="/pricing" className={buttonVariants({ className: "mt-5" })}>Lihat paket</Link></div>;
  }

  return <ProductsWorkspace />;
}
