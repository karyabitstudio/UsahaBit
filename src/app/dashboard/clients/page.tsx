import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import { ClientListWorkspace } from "@/components/clients/ClientListWorkspace";

export default async function ClientsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const accountId = user.id;
  const { data: clients } = await supabase.from("clients").select("id, name, email, phone, address, notes").eq("user_id", accountId).order("name");

  return <div className="mx-auto max-w-5xl space-y-6"><header className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-xl font-bold tracking-tight sm:text-2xl">Daftar Klien</h1><p className="text-muted-foreground">Kelola informasi klien untuk invoice usahamu.</p></div><Link href="/dashboard/clients/new" className={buttonVariants()}>Tambah klien</Link></header><ClientListWorkspace clients={clients || []} /></div>;
}
