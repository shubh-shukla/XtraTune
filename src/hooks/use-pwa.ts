"use client";

import { useEffect, useState, useCallback, useRef } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * Registers the service worker and manages the PWA install prompt.
 *
 * Returns:
 * - `canInstall`  – true when the browser offers an install prompt
 * - `install()`   – trigger the native install dialog
 * - `isInstalled`  – true when running in standalone / installed mode
 */
export function usePWA() {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  // Register service worker
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if already installed
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as any).standalone === true
    ) {
      setIsInstalled(true);
    }

    // Register SW
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((_reg) => {
          // SW registered
        })
        .catch((err) => {
          console.warn("[SW] registration failed:", err);
        });
    }

    // Capture the install prompt
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    // Detect when installed via the prompt
    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setCanInstall(false);
      deferredPrompt.current = null;
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const install = useCallback(async () => {
    if (!deferredPrompt.current) return;
    deferredPrompt.current.prompt();
    const result = await deferredPrompt.current.userChoice;
    if (result.outcome === "accepted") {
      setIsInstalled(true);
    }
    setCanInstall(false);
    deferredPrompt.current = null;
  }, []);

  return { canInstall, install, isInstalled };
}
