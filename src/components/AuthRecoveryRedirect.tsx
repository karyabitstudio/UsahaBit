"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function AuthRecoveryRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (window.location.pathname !== "/auth/reset-password") {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const searchParams = new URLSearchParams(window.location.search);
      const inviteType = hashParams.get("type") === "invite" || searchParams.get("type") === "invite";
      if (inviteType && window.location.pathname !== "/auth/accept-invite") {
        window.location.replace(`/auth/accept-invite${window.location.search}${window.location.hash}`);
        return;
      }
      const recoveryType = hashParams.get("type") === "recovery" || searchParams.get("type") === "recovery";
      const code = searchParams.get("code");

      if (code && (recoveryType || searchParams.get("next") === "/auth/reset-password")) {
        const callback = new URL("/auth/callback", window.location.origin);
        callback.searchParams.set("code", code);
        callback.searchParams.set("next", "/auth/reset-password");
        window.location.replace(callback.toString());
        return;
      }

      if (recoveryType) {
        window.location.replace(`/auth/reset-password${window.location.search}${window.location.hash}`);
        return;
      }
    }

    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" && window.location.pathname !== "/auth/reset-password") {
        router.replace("/auth/reset-password");
      }
    });
    return () => subscription.unsubscribe();
  }, [router, pathname]);

  return null;
}
