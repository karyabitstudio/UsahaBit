"use client";

import { Button } from "@/components/ui/button";
import { MessageCircle, Lock } from "lucide-react";
import Link from "next/link";

interface Props {
  invoice: any;
  client: any;
  profile: any;
}

export function SendWhatsAppButton({ invoice, client, profile }: Props) {
  const plan = profile?.plan || "free";
  const isAllowed = plan === "pro" || plan === "business";

  // ... (function handleSend tetap sama seperti di atas)

  if (!isAllowed) {
    return (
      <Button variant="outline" asChild>
        <Link href="/pricing">
          <Lock className="h-4 w-4 mr-2" />
          Kirim via WhatsApp (Pro)
        </Link>
      </Button>
    );
  }

  return (
    <Button variant="outline" onClick={handleSend}>
      <MessageCircle className="h-4 w-4 mr-2" />
      Kirim via WhatsApp
    </Button>
  );
}
