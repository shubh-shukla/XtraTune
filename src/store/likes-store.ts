"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type LikeEntityType = "track" | "album" | "playlist";

type LikeState = {
  likes: Record<LikeEntityType, string[]>;
  toggleLike: (type: LikeEntityType, id: string) => boolean; // returns new liked state
  isLiked: (type: LikeEntityType, id: string) => boolean;
  clear: () => void;
};

const emptyLikes: Record<LikeEntityType, string[]> = {
  track: [],
  album: [],
  playlist: [],
};

export const useLikeStore = create<LikeState>()(
  persist(
    (set, get) => ({
      likes: emptyLikes,
      toggleLike: (type, id) => {
        const current = get().likes[type] || [];
        const exists = current.includes(id);
        const next = exists ? current.filter((x) => x !== id) : [...current, id];
        set({ likes: { ...get().likes, [type]: next } });
        return !exists;
      },
      isLiked: (type, id) => {
        const list = get().likes[type] || [];
        return list.includes(id);
      },
      clear: () => set({ likes: emptyLikes }),
    }),
    {
      name: "xtratune:likes",
      storage: createJSONStorage(() => localStorage),
      version: 1,
    }
  )
);
