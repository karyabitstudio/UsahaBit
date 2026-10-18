"use client";

import { useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Free",
    price: { monthly: 0, yearly: 0 },
    description: "Cocok untuk mulai mencoba",
    features: [
      "5 Invoice per bulan",
      "3 Template surat dasar",
      "10 Client",
      "Watermark di PDF",
      "Support email",
    ],
    cta: "Mulai Gratis",
    href: "/register",
    popular: false,
  },
  {
    name: "Pro",
    price: { monthly: 79000, yearly: 699000 },
    description: "Paling banyak dipilih UMKM",
    features: [
      "Unlimited Invoice & Surat",
      "Semua Template + Custom Branding",
      "Unlimited Client",
      "Tanpa Watermark",
      "Katalog Produk",
      "Kirim via WhatsApp",
      "Priority Support",
    ],
    cta: "Upgrade ke Pro",
    href: "/register?plan=pro",
    popular: true,
  },
  {
    name: "Business",
    price: { monthly: 149000, yearly: 1299000 },
    description: "Untuk tim & bisnis berkembang",
    features: [
      "Semua fitur Pro",
      "Multi user (sampai 5 orang)",
      "Custom Domain (opsional)",
      "Laporan & Export Data",
      "Dedicated Support",
    ],
    cta: "Pilih Business",
    href: "/register?plan=business",
    popular: false,
  },
];

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(true);

  const formatPrice = (price: number) => {
    if (price === 0) return "Rp 0";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-background px-4 py-10 sm:py-16">
      <div className="max-w-6xl mx-auto">
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
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                    Paling Populer
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-xl font-semibold">{plan.name}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {plan.description}
                </p>
                <div className="mt-4">
                  <span className="text-3xl font-bold sm:text-4xl">
                    {formatPrice(
                      isYearly ? plan.price.yearly : plan.price.monthly,
                    )}
                  </span>
                  {plan.price.monthly > 0 && (
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

              <Link
                href={plan.href}
                className={buttonVariants({
                  className: "w-full",
                  variant: plan.popular ? "default" : "outline",
                  size: "lg",
                })}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
