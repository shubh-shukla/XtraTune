"use client";

import { Download, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { usePWA } from "@/hooks/use-pwa";

/**
 * Shows a small install banner at the bottom of the screen when the PWA
 * can be installed. Dismissable.
 */
export function PWAInstallPrompt() {
  const { canInstall, install, isInstalled } = usePWA();
  const [dismissed, setDismissed] = useState(false);

  if (!canInstall || isInstalled || dismissed) return null;

  return (
    <div className="fixed bottom-[76px] left-0 right-0 z-[60] flex justify-center px-4 pb-2">
      <div className="flex items-center gap-3 bg-primary text-primary-foreground rounded-xl px-4 py-3 shadow-lg max-w-md w-full">
        <Download className="h-5 w-5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Install XtraTune</p>
          <p className="text-xs opacity-80">Get the full app experience</p>
        </div>
        <Button size="sm" variant="secondary" className="shrink-0" onClick={install}>
          Install
        </Button>
        <button
          onClick={() => setDismissed(true)}
          className="shrink-0 opacity-70 hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
