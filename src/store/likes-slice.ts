import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type LikeEntityType = "track" | "album" | "playlist";
export type SaveEntityType = "track" | "album" | "playlist";

interface LikesState {
  saves: Record<SaveEntityType, string[]>;
}

const initialState: LikesState = {
  saves: { track: [], album: [], playlist: [] },
};

const likesSlice = createSlice({
  name: "likes",
  initialState,
  reducers: {
    toggleSave(state, action: PayloadAction<{ entityType: SaveEntityType; id: string }>) {
      const { entityType, id } = action.payload;
      const list = state.saves[entityType];
      const idx = list.indexOf(id);
      if (idx === -1) {
        list.push(id);
      } else {
        list.splice(idx, 1);
      }
    },
    clearLikes(state) {
      state.saves = { track: [], album: [], playlist: [] };
    },
  },
});

export const { toggleSave, clearLikes } = likesSlice.actions;
export default likesSlice.reducer;
