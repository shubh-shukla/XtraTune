import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type Playlist = {
  id: string;
  title?: string;
  artist?: string;
  image?: string;
  duration?: number;
};
interface SongStore {
  currentSong: number;
  playlist: Playlist[];
  volume: number;
  setPlaylist: (playlist: Playlist[], index?: number) => void;
  setCurrentSong: (currentSong: number) => void;
  setVolume: (volume: number) => void;
  removeAt: (index: number) => void;
  updateMeta: (index: number, meta: Partial<Playlist>) => void;
}
export const useSongStore = create<SongStore>()(
  persist(
    (set) => ({
      playlist: [],
      currentSong: 0,
      volume: 0.5,
      setPlaylist: (playlist, index) =>
        set({
          playlist,
          ...(index !== undefined ? { currentSong: index } : {}),
        }),
      setCurrentSong: (currentSong) => set({ currentSong }),
      setVolume: (volume) => set({ volume }),
      removeAt: (index) =>
        set((state) => {
          if (index < 0 || index >= state.playlist.length) return state;
          const nextList = state.playlist.filter((_, i) => i !== index);
          let nextCurrent = state.currentSong;
          if (state.playlist.length === 1) {
            nextCurrent = 0;
          } else if (index < state.currentSong) {
            nextCurrent = state.currentSong - 1;
          } else if (index === state.currentSong) {
            nextCurrent = index >= nextList.length ? nextList.length - 1 : index;
          }
          return {
            playlist: nextList,
            currentSong: Math.max(0, nextCurrent),
          };
        }),
      updateMeta: (index, meta) =>
        set((state) => {
          if (index < 0 || index >= state.playlist.length) return state;
          const next = [...state.playlist];
          next[index] = { ...next[index], ...meta };
          return { playlist: next };
        }),
    }),
    {
      name: "xtratune:player",
      storage: createJSONStorage(() => localStorage),
    }
  )
);
