"use client";

import { useEffect, useState, useCallback } from "react";

/**
 * Ensures only ONE browser tab plays audio at a time.
 *
 * Each tab gets a random ID. When a tab wants to play, it broadcasts
 * a "claim" message. All other tabs see the claim and yield (pause).
 * On first mount, the tab does NOT auto-claim — it waits for a user
 * interaction (play click / song card click) to claim ownership.
 *
 * Returns:
 *  - isActiveTab: true if THIS tab owns audio playback
 *  - claimAudio: call this when the user initiates playback in this tab
 */

const CHANNEL_NAME = "xtratune:audio-leader";
const TAB_ID =
  typeof crypto !== "undefined" ? crypto.randomUUID() : Math.random().toString(36).slice(2);

// Module-level so it's shared across all hook instances in the same tab
let _claimed = false;
const _listeners: Set<() => void> = new Set();

function notify() {
  _listeners.forEach((fn) => fn());
}

// Set up the BroadcastChannel once per tab
let _bc: BroadcastChannel | null = null;

function getBc(): BroadcastChannel | null {
  if (typeof BroadcastChannel === "undefined") return null;
  if (!_bc) {
    _bc = new BroadcastChannel(CHANNEL_NAME);
    _bc.onmessage = (ev) => {
      if (ev.data?.type === "claim" && ev.data?.tabId !== TAB_ID) {
        // Another tab claimed audio — we yield
        _claimed = false;
        notify();
      }
    };
  }
  return _bc;
}

function claimAudioGlobal() {
  if (_claimed) return; // already own it
  _claimed = true;
  getBc()?.postMessage({ type: "claim", tabId: TAB_ID });
  notify();
}

export function useAudioTab() {
  const [isActive, setIsActive] = useState(_claimed);

  useEffect(() => {
    // Ensure channel is initialised
    getBc();

    const listener = () => setIsActive(_claimed);
    _listeners.add(listener);

    // Sync initial state
    setIsActive(_claimed);

    return () => {
      _listeners.delete(listener);
    };
  }, []);

  const claimAudio = useCallback(() => {
    claimAudioGlobal();
  }, []);

  return { isActiveTab: isActive, claimAudio };
}
