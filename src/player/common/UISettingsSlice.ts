import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface UISetting {
  name: string;
  value: string;
}

export interface UISettingsState {
  byName: Record<string, UISetting>;
  allsettings: UISetting[];
}

const initialState: UISettingsState = {
  byName: {
    displayuisettingsbar: { name: 'displayuisettingsbar', value: 'true'},
    gridmode: { name: 'gridmode', value: 'normal'},
    xscolumnsnumber: { name: 'xscolumnsnumber', value: '6'},
    smcolumnsnumber: { name: 'smcolumnsnumber', value: '4'},
    mdcolumnsnumber: { name: 'mdcolumnsnumber', value: '3'},
    listitemheight: { name: 'listitemheight', value: '200px'},
    containerwidth: { name: 'containerwidth', value: 'fixed'},
    playlistcontainerwidth: { name: 'playlistcontainerwidth', value: 'fixed'},
  },
  allsettings: [
    { name: 'displayuisettingsbar', value: 'true'},
    { name: 'gridmode', value: 'normal'},
    { name: 'xscolumnsnumber', value: '6'},
    { name: 'smcolumnsnumber', value: '4'},
    { name: 'mdcolumnsnumber', value: '3'},
    { name: 'listitemheight', value: '200px'},
    { name: 'containerwidth', value: 'fixed'},
    { name: 'playlistcontainerwidth', value: 'fixed'},
  ]
};

export const UISettingsSlice = createSlice({
  name: "uisettings",
  initialState,
  reducers: {
    setUISetting: (state, action: PayloadAction<UISetting>) => {
      const { name, value } = action.payload;

      const existingUISetting = state.allsettings.find((uisetting) => uisetting.name === name);

      if (existingUISetting) {
        existingUISetting.value = value;
        state.byName[action.payload.name] = action.payload;
      } else {
        state.byName[action.payload.name] = action.payload;
        state.allsettings.push(action.payload);
      }
    },
  },
});

export const {
  setUISetting
} = UISettingsSlice.actions;

export default UISettingsSlice.reducer;
