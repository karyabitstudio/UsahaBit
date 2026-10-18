"use client";

import { useEffect } from "react";

export function ClickTracker() {
  useEffect(() => {
    function trackClick(event: MouseEvent) {
      const target = event.target;
      if (!(target instanceof Element)) return;
      const control = target.closest("a, button, [role='button']");
      if (!(control instanceof HTMLElement)) return;

      const path = window.location.pathname;
      if (path.startsWith("/admin") || path.startsWith("/dashboard") || path.startsWith("/api")) return;

      const label = (control.dataset.trackLabel || control.getAttribute("aria-label") || control.textContent || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 80);
      if (!label) return;

      const body = JSON.stringify({ path, label });
      if (navigator.sendBeacon) {
        navigator.sendBeacon("/api/click-stats", new Blob([body], { type: "application/json" }));
      } else {
        void fetch("/api/click-stats", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
          keepalive: true,
        });
      }
    }

    document.addEventListener("click", trackClick, true);
    return () => document.removeEventListener("click", trackClick, true);
  }, []);

  return null;
}
