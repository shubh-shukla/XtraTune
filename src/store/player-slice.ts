import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type Playlist = {
  id: string;
  title?: string;
  artist?: string;
  image?: string;
  duration?: number;
};

interface PlayerState {
  playlist: Playlist[];
  currentSong: number;
  volume: number;
  autoplay: boolean; // auto-queue related songs when track ends
}

const initialState: PlayerState = {
  playlist: [],
  currentSong: 0,
  volume: 0.5,
  autoplay: true,
};

const playerSlice = createSlice({
  name: "player",
  initialState,
  reducers: {
    setPlaylist(state, action: PayloadAction<{ playlist: Playlist[]; index?: number }>) {
      state.playlist = action.payload.playlist;
      if (action.payload.index !== undefined) {
        state.currentSong = action.payload.index;
      }
    },
    setCurrentSong(state, action: PayloadAction<number>) {
      state.currentSong = action.payload;
    },
    setVolume(state, action: PayloadAction<number>) {
      state.volume = action.payload;
    },
    toggleAutoplay(state) {
      state.autoplay = !state.autoplay;
    },
    appendToPlaylist(state, action: PayloadAction<Playlist[]>) {
      // Add songs to end of queue, deduplicating by id
      const existingIds = new Set(state.playlist.map((s) => s.id));
      const newSongs = action.payload.filter((s) => !existingIds.has(s.id));
      state.playlist.push(...newSongs);
    },
    removeAt(state, action: PayloadAction<number>) {
      const index = action.payload;
      if (index < 0 || index >= state.playlist.length) return;
      const nextList = state.playlist.filter((_, i) => i !== index);
      let nextCurrent = state.currentSong;
      if (state.playlist.length === 1) {
        nextCurrent = 0;
      } else if (index < state.currentSong) {
        nextCurrent = state.currentSong - 1;
      } else if (index === state.currentSong) {
        nextCurrent = index >= nextList.length ? nextList.length - 1 : index;
      }
      state.playlist = nextList;
      state.currentSong = Math.max(0, nextCurrent);
    },
    updateMeta(state, action: PayloadAction<{ index: number; meta: Partial<Playlist> }>) {
      const { index, meta } = action.payload;
      if (index < 0 || index >= state.playlist.length) return;
      state.playlist[index] = { ...state.playlist[index], ...meta };
    },
  },
});

export const {
  setPlaylist,
  setCurrentSong,
  setVolume,
  toggleAutoplay,
  appendToPlaylist,
  removeAt,
  updateMeta,
} = playerSlice.actions;
export default playerSlice.reducer;
