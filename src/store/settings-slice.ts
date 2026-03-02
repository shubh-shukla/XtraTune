import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type AudioQuality = "low" | "medium" | "high" | "extreme";
export type ThemeChoice = "light" | "dark" | "system";

interface SettingsState {
  audioQuality: AudioQuality;
  theme: ThemeChoice;
  crossfade: number; // seconds (0 = off)
  showLyricsAuto: boolean; // auto-open lyrics panel when available
  sleepTimer: number; // minutes (0 = off)
}

const initialState: SettingsState = {
  audioQuality: "high",
  theme: "dark",
  crossfade: 0,
  showLyricsAuto: false,
  sleepTimer: 0,
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setAudioQuality(state, action: PayloadAction<AudioQuality>) {
      state.audioQuality = action.payload;
    },
    setTheme(state, action: PayloadAction<ThemeChoice>) {
      state.theme = action.payload;
    },
    setCrossfade(state, action: PayloadAction<number>) {
      state.crossfade = Math.max(0, Math.min(12, action.payload));
    },
    setShowLyricsAuto(state, action: PayloadAction<boolean>) {
      state.showLyricsAuto = action.payload;
    },
    setSleepTimer(state, action: PayloadAction<number>) {
      state.sleepTimer = Math.max(0, action.payload);
    },
  },
});

export const { setAudioQuality, setTheme, setCrossfade, setShowLyricsAuto, setSleepTimer } =
  settingsSlice.actions;
export default settingsSlice.reducer;
