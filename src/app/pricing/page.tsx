"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SiteFooter } from "@/components/SiteFooter";
import { DEFAULT_SITE_SETTINGS, type SiteSettings } from "@/lib/site-settings";

const plans = [
  {
    name: "Free",
    key: "free",
    description: "Cocok untuk mulai mencoba",
    features: [
      "3 Invoice per bulan",
      "3 penggunaan demo per layanan per bulan",
      "3 Template surat dasar",
      "10 Client",
      "Watermark di PDF",
      "Support melalui tiket",
    ],
    popular: false,
  },
  {
    name: "Pro",
    key: "pro",
    description: "Paling banyak dipilih UMKM",
    features: [
      "Unlimited Invoice & Surat",
      "Semua Template + Custom Branding",
      "Unlimited Client",
      "Tanpa Watermark",
      "Katalog Produk",
      "Kirim via WhatsApp",
      "Prioritas penanganan support",
    ],
    popular: true,
  },
  {
    name: "Business",
    key: "business",
    description: "Untuk tim & bisnis berkembang",
    features: [
      "Semua fitur Pro",
      "Multi user (sampai 5 orang)",
      "Laporan & Export Data",
      "Antrean support Business",
    ],
    popular: false,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const [isYearly, setIsYearly] = useState(true);
  const [contactError, setContactError] = useState<string | null>(null);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);

  useEffect(() => {
    fetch("/api/site-settings", { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((settings) => { if (settings) setSiteSettings(settings); })
      .catch(() => undefined);
  }, []);

  const formatPrice = (price: number) => {
    if (price === 0) return "Rp 0";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const choosePlan = (plan: (typeof plans)[number]) => {
    if (plan.key === "free") {
      router.push("/coba/layanan");
      return;
    }

    let phone = siteSettings.salesWhatsapp.replace(/\D/g, "");
    if (phone.startsWith("0")) phone = `62${phone.slice(1)}`;
    else if (phone.startsWith("8")) phone = `62${phone}`;
    if (!phone) {
      setContactError("Nomor WhatsApp tujuan belum diatur. Isi NEXT_PUBLIC_SALES_WHATSAPP di .env.local.");
      return;
    }
    setContactError(null);
    const period = isYearly ? "Tahunan (1 tahun)" : "Bulanan (1 bulan)";
    const price = formatPrice(getPlanPrice(plan.key, siteSettings, isYearly));
    const message = [
      "Halo UsahaBit, saya ingin membeli paket.",
      "",
      `Paket: ${plan.name}`,
      `Periode: ${period}`,
      `Harga: ${price}`,
      "",
      "Mohon info cara pembayarannya. Terima kasih.",
    ].join("\n");
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:py-16">
      <div className="max-w-6xl mx-auto">
        <Link href="/" className="mb-8 inline-flex text-sm text-muted-foreground transition hover:text-foreground">← Kembali ke beranda</Link>
        <div className="text-center mb-12">
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
            Pilih Paket yang Cocok untuk Bisnismu
          </h1>
          <p className="mt-3 text-muted-foreground text-lg">
            Mulai gratis. Upgrade kapan saja saat bisnismu berkembang.
          </p>

          {/* Toggle */}
          <div className="mt-8 inline-flex items-center gap-3 bg-muted p-1 rounded-full">
            <button
              onClick={() => setIsYearly(false)}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-medium transition",
                !isYearly ? "bg-background shadow" : "text-muted-foreground",
              )}
            >
              Bulanan
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={cn(
                "px-5 py-2 rounded-full text-sm font-medium transition",
                isYearly ? "bg-background shadow" : "text-muted-foreground",
              )}
            >
              Tahunan{" "}
              <span className="text-emerald-400 text-xs ml-1">Hemat 26%</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={cn(
                "glass-panel relative flex flex-col rounded-2xl p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_55px_color-mix(in_oklch,var(--primary)_14%,transparent)]",
                plan.popular
                  ? "animate-rise-glow border-primary/70 shadow-lg shadow-primary/10 md:scale-[1.02]"
                  : "animate-rise-in border-border",
              )}
              style={{ animationDelay: `${index * 120}ms` }}
            >
              <div className="mb-6">
                <h3 className="text-xl font-semibold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {plan.description}
                </p>
                <div className="mt-4">
                  <span className="text-3xl font-bold sm:text-4xl">
                    {formatPrice(getPlanPrice(plan.key, siteSettings, isYearly))}
                  </span>
                  {plan.key !== "free" && (
                    <span className="text-muted-foreground text-sm">
                      /{isYearly ? "tahun" : "bulan"}
                    </span>
                  )}
                </div>
              </div>

              <ul className="space-y-3 flex-1 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => choosePlan(plan)}
                className={buttonVariants({
                  className: "w-full",
                  variant: plan.popular ? "default" : "outline",
                  size: "lg",
                })}
              >
                {plan.key === "free" ? "Coba Gratis" : "Pilih Paket via WhatsApp"}
              </button>
            </div>
          ))}
        </div>
        {contactError && <p role="alert" className="mt-6 text-center text-sm text-destructive">{contactError}</p>}
      </div>
      <SiteFooter />
    </div>
  );
}

function getPlanPrice(planKey: string, settings: SiteSettings, yearly: boolean) {
  if (planKey === "pro") return yearly ? settings.pricing.proYearly : settings.pricing.proMonthly;
  if (planKey === "business") return yearly ? settings.pricing.businessYearly : settings.pricing.businessMonthly;
  return 0;
}
