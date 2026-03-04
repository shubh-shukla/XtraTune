"use client";

import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { usePWA } from "@/hooks/use-pwa";

/**
 * Client-side PWA bootstrap.
 * Registers the service worker and renders the install prompt banner.
 * Must be rendered inside the body (client-only).
 */
export function PWAProvider() {
  // This call registers the service worker as a side effect
  usePWA();

  return <PWAInstallPrompt />;
}
