import { createClient } from "@/lib/supabase/server";
import { InvoiceForm } from "@/components/invoices/InvoiceForm";

export default async function NewInvoicePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: clients } = await supabase
    .from("clients")
    .select("id, name")
    .eq("user_id", user!.id)
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Buat Invoice</h1>
        <p className="text-muted-foreground">Isi detail invoice baru</p>
      </div>
      <InvoiceForm clients={clients || []} />
    </div>
  );
}
