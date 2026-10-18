export type Plan = "free" | "pro" | "business";

export const PLAN_LIMITS = {
  free: {
    maxInvoicesPerMonth: 5,
    maxClients: 10,
    maxDocuments: 5,
    allowCustomBranding: false,
    allowNoWatermark: false,
    allowWhatsapp: false,
    allowMultiUser: false,
  },
  pro: {
    maxInvoicesPerMonth: Infinity,
    maxClients: Infinity,
    maxDocuments: Infinity,
    allowCustomBranding: true,
    allowNoWatermark: true,
    allowWhatsapp: true,
    allowMultiUser: false,
  },
  business: {
    maxInvoicesPerMonth: Infinity,
    maxClients: Infinity,
    maxDocuments: Infinity,
    allowCustomBranding: true,
    allowNoWatermark: true,
    allowWhatsapp: true,
    allowMultiUser: true,
  },
} as const;

export function getPlanLimits(plan: Plan = "free") {
  return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
}

export function isPlanActive(planExpiresAt: string | null): boolean {
  if (!planExpiresAt) return false;
  return new Date(planExpiresAt) > new Date();
}
