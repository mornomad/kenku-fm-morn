import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// "split"   — the original two fields: a tags filter and a separate title filter.
// "unified" — a single bar that searches tags by default; pressing space on an
//             empty input toggles it to search-by-name (and back).
export type SearchMode = "split" | "unified";

export interface SettingsState {
  searchMode: SearchMode;
}

const initialState: SettingsState = {
  searchMode: "split",
};

export const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setSearchMode: (state, action: PayloadAction<SearchMode>) => {
      state.searchMode = action.payload;
    },
  },
});

export const { setSearchMode } = settingsSlice.actions;

export default settingsSlice.reducer;
