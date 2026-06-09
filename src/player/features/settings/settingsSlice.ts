import { createSlice, PayloadAction } from "@reduxjs/toolkit";

// "split"   — the original two fields: a tags filter and a separate title filter.
// "unified" — a single bar that searches tags by default; pressing space on an
//             empty input toggles it to search-by-name (and back).
export type SearchMode = "split" | "unified";

// How the player's seek bar is drawn. "slider" turns the waveform off entirely
// (keeping the original MUI slider); the others are waveform looks.
export type TimelineStyle = "bars" | "smooth" | "line" | "slider";

export interface SettingsState {
  searchMode: SearchMode;
  timelineStyle: TimelineStyle;
  // Draw the faded mirrored copy under the waveform.
  waveformReflection: boolean;
}

const initialState: SettingsState = {
  searchMode: "unified",
  timelineStyle: "bars",
  waveformReflection: true,
};

export const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setSearchMode: (state, action: PayloadAction<SearchMode>) => {
      state.searchMode = action.payload;
    },
    setTimelineStyle: (state, action: PayloadAction<TimelineStyle>) => {
      state.timelineStyle = action.payload;
    },
    setWaveformReflection: (state, action: PayloadAction<boolean>) => {
      state.waveformReflection = action.payload;
    },
  },
});

export const { setSearchMode, setTimelineStyle, setWaveformReflection } =
  settingsSlice.actions;

export default settingsSlice.reducer;
