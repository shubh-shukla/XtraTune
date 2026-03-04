"use client";

import {
  Sun,
  Volume2,
  Music,
  User,
  LogOut,
  Download,
  Info,
  Disc3,
  Timer,
  Mic2,
} from "lucide-react";
import Image from "next/image";
import { signIn, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { usePWA } from "@/hooks/use-pwa";
import { cn } from "@/lib/utils";
import { useAppSelector, useAppDispatch } from "@/store/hooks";
import { clearLikes } from "@/store/likes-slice";
import { toggleAutoplay } from "@/store/player-slice";
import {
  setAudioQuality,
  setTheme as setThemeAction,
  setCrossfade,
  setShowLyricsAuto,
  setSleepTimer,
  type AudioQuality,
  type ThemeChoice,
} from "@/store/settings-slice";

// ─── Reusable components ────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground px-1 mb-3">
        {title}
      </h2>
      <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
        {children}
      </div>
    </section>
  );
}

function Row({
  icon: Icon,
  label,
  desc,
  children,
}: {
  icon: React.ElementType;
  label: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{label}</p>
        {desc && <p className="text-xs text-muted-foreground">{desc}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-lg bg-muted p-0.5 gap-0.5">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
            value === opt.value
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
        checked ? "bg-primary" : "bg-muted",
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-5" : "translate-x-1",
        )}
      />
    </button>
  );
}

// ─── Shortcuts data ─────────────────────────────────────────────────

const shortcuts = [
  { keys: ["Space", "K"], action: "Play / Pause" },
  { keys: ["→", "L"], action: "Next track" },
  { keys: ["←", "J"], action: "Previous track" },
  { keys: ["↑"], action: "Volume up" },
  { keys: ["↓"], action: "Volume down" },
  { keys: ["M"], action: "Mute / Unmute" },
  { keys: ["A"], action: "Toggle autoplay" },
];

// ─── Main page ──────────────────────────────────────────────────────

export default function SettingsPage() {
  const dispatch = useAppDispatch();
  const { setTheme: setNextTheme, theme: currentTheme } = useTheme();
  const { user, isAuthenticated } = useAuth();
  const { canInstall, install, isInstalled } = usePWA();

  const settings = useAppSelector((s) => s.settings);
  const autoplay = useAppSelector((s) => s.player.autoplay);

  const handleTheme = (t: ThemeChoice) => {
    dispatch(setThemeAction(t));
    setNextTheme(t);
  };

  const handleSignOut = async () => {
    dispatch(clearLikes());
    try {
      await fetch("/api/user/logout", { method: "POST", credentials: "same-origin" });
    } catch {}
    signOut({ callbackUrl: "/" });
  };

  return (
    <div className="px-2 sm:px-4 py-6 max-w-2xl mx-auto space-y-8">
      <h1 className="text-2xl sm:text-3xl font-cal">Settings</h1>

      {/* ── Account ── */}
      <Section title="Account">
        {isAuthenticated && user ? (
          <div className="flex items-center gap-3 px-4 py-4">
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name ?? ""}
                width={48}
                height={48}
                className="h-12 w-12 rounded-full object-cover"
                unoptimized
              />
            ) : (
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-orange-400 to-fuchsia-500 flex items-center justify-center text-white font-semibold">
                {(user.name ?? "U").slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.provider}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={handleSignOut}
            >
              <LogOut className="h-3.5 w-3.5" />
              Sign out
            </Button>
          </div>
        ) : (
          <Row
            icon={User}
            label="Sign in"
            desc="Sign in to sync your playlists, likes, and settings"
          >
            <Button size="sm" onClick={() => signIn(undefined, { callbackUrl: "/settings" })}>
              Sign in
            </Button>
          </Row>
        )}
      </Section>

      {/* ── Appearance ── */}
      <Section title="Appearance">
        <Row icon={Sun} label="Theme" desc="Choose your display preference">
          <SegmentedControl
            options={[
              { value: "light" as ThemeChoice, label: "Light" },
              { value: "dark" as ThemeChoice, label: "Dark" },
              { value: "system" as ThemeChoice, label: "System" },
            ]}
            value={(currentTheme as ThemeChoice) ?? settings.theme}
            onChange={handleTheme}
          />
        </Row>
      </Section>

      {/* ── Playback ── */}
      <Section title="Playback">
        <Row icon={Volume2} label="Audio Quality" desc="Higher quality uses more bandwidth">
          <SegmentedControl
            options={[
              { value: "low" as AudioQuality, label: "Low" },
              { value: "medium" as AudioQuality, label: "Med" },
              { value: "high" as AudioQuality, label: "High" },
              { value: "extreme" as AudioQuality, label: "Max" },
            ]}
            value={settings.audioQuality}
            onChange={(v) => dispatch(setAudioQuality(v))}
          />
        </Row>
        <Row icon={Disc3} label="Autoplay" desc="Auto-queue related songs when track ends">
          <Toggle checked={autoplay} onChange={() => dispatch(toggleAutoplay())} />
        </Row>
        <Row
          icon={Mic2}
          label="Auto-show Lyrics"
          desc="Open lyrics panel automatically when available"
        >
          <Toggle
            checked={settings.showLyricsAuto}
            onChange={(v) => dispatch(setShowLyricsAuto(v))}
          />
        </Row>
        <Row
          icon={Music}
          label="Crossfade"
          desc={settings.crossfade > 0 ? `${settings.crossfade}s between songs` : "Off"}
        >
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={0}
              max={12}
              step={1}
              value={settings.crossfade}
              onChange={(e) => dispatch(setCrossfade(Number(e.target.value)))}
              className="w-24 accent-primary"
            />
            <span className="text-xs text-muted-foreground w-6 text-right">
              {settings.crossfade}s
            </span>
          </div>
        </Row>
        <Row
          icon={Timer}
          label="Sleep Timer"
          desc={settings.sleepTimer > 0 ? `Stops after ${settings.sleepTimer} min` : "Off"}
        >
          <SegmentedControl
            options={[
              { value: "0", label: "Off" },
              { value: "15", label: "15m" },
              { value: "30", label: "30m" },
              { value: "45", label: "45m" },
              { value: "60", label: "60m" },
            ]}
            value={String(settings.sleepTimer)}
            onChange={(v) => dispatch(setSleepTimer(Number(v)))}
          />
        </Row>
      </Section>

      {/* ── Keyboard Shortcuts ── */}
      <Section title="Keyboard Shortcuts">
        {shortcuts.map(({ keys, action }) => (
          <div key={action} className="flex items-center justify-between px-4 py-3">
            <span className="text-sm">{action}</span>
            <div className="flex gap-1.5">
              {keys.map((k) => (
                <kbd
                  key={k}
                  className="inline-flex h-7 min-w-[28px] items-center justify-center rounded-md border border-border bg-muted px-2 text-xs font-mono text-muted-foreground"
                >
                  {k}
                </kbd>
              ))}
            </div>
          </div>
        ))}
      </Section>

      {/* ── App ── */}
      <Section title="App">
        {canInstall && !isInstalled && (
          <Row
            icon={Download}
            label="Install App"
            desc="Install XtraTune as a desktop / mobile app"
          >
            <Button size="sm" onClick={install}>
              Install
            </Button>
          </Row>
        )}
        {isInstalled && (
          <Row icon={Download} label="App Installed" desc="XtraTune is installed on your device">
            <span className="text-xs text-emerald-500 font-medium">Active</span>
          </Row>
        )}
        <Row icon={Info} label="Version" desc="XtraTune v0.1.0">
          <span className="text-xs text-muted-foreground">Next.js 14</span>
        </Row>
      </Section>

      <div className="pb-24" />
    </div>
  );
}
