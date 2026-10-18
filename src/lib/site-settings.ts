export type SiteSettings = {
  heroBadge: string;
  heroTitle: string;
  heroAccent: string;
  heroDescription: string;
  salesWhatsapp: string;
  pricing: {
    proMonthly: number;
    proYearly: number;
    businessMonthly: number;
    businessYearly: number;
  };
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  heroBadge: "Administrasi usaha, lebih sederhana",
  heroTitle: "Dokumen usaha rapi,",
  heroAccent: "tanpa ribet.",
  heroDescription: "Buat invoice profesional untuk bisnismu dalam hitungan menit, langsung dari browser.",
  salesWhatsapp: process.env.NEXT_PUBLIC_SALES_WHATSAPP || "",
  pricing: {
    proMonthly: 69000,
    proYearly: 629000,
    businessMonthly: 135000,
    businessYearly: 1169000,
  },
};
