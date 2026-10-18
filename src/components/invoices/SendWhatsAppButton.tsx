"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { MessageCircle, Lock } from "lucide-react";
import Link from "next/link";
import { isPlanActive } from "@/lib/plan";

interface Props {
  invoice: any;
  client: any;
  profile: any;
}

export function SendWhatsAppButton({ invoice, client, profile }: Props) {
  const plan = profile?.plan || "free";
  const isAllowed =
    (plan === "pro" || plan === "business") &&
    isPlanActive(profile?.plan_expires_at);

  const handleSend = () => {
    const amount = new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Number(invoice.total) || 0);
    const message = [
      `Halo${client?.name ? ` ${client.name}` : ""},`,
      `Berikut invoice ${invoice.invoice_number} dari ${profile?.business_name || "kami"} sebesar ${amount}.`,
      "Silakan hubungi kami jika ada pertanyaan. Terima kasih.",
    ].join("\n\n");
    const phone = String(client?.phone || "").replace(/\D/g, "");
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;

    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (!isAllowed) {
    return (
      <Link
        href="/pricing"
        className={buttonVariants({ variant: "outline" })}
      >
        <Lock className="h-4 w-4 mr-2" />
        Kirim via WhatsApp (Pro)
      </Link>
    );
  }

  return (
    <Button variant="outline" onClick={handleSend}>
      <MessageCircle className="h-4 w-4 mr-2" />
      Kirim via WhatsApp
    </Button>
  );
}
