import { combineReducers, configureStore } from "@reduxjs/toolkit";
import connectionReducer from "../features/connection/connectionSlice";
import outputReducer from "../features/output/outputSlice";
import settingsReducer from "../features/settings/settingsSlice";
import bookmarksReducer from "../features/bookmarks/bookmarksSlice";
import tabsReducer from "../features/tabs/tabsSlice";
import playerReducer from "../features/player/playerSlice";
import inputReducer from "../features/input/inputSlice";
import uisettingsReducer from "../../player/common/UISettingsSlice";

import {
  persistStore,
  persistReducer,
  createMigrate,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";

const rootReducer = combineReducers({
  connection: connectionReducer,
  output: outputReducer,
  uisettings: uisettingsReducer,
  settings: settingsReducer,
  bookmarks: bookmarksReducer,
  tabs: tabsReducer,
  player: playerReducer,
  input: inputReducer,
});

const migrations: any = {
  2: (state: RootState): RootState => {
    return {
      ...state,
      settings: {
        ...state.settings,
        urlBarEnabled: true,
        remoteEnabled: false,
        remoteAddress: "127.0.0.1",
        remotePort: "3333",
        externalInputsEnabled: false,
        multipleInputsEnabled: false,
        multipleOutputsEnabled: false,
      },
    };
  },
  // v1.1 - Add performance mode
  3: (state: RootState): RootState => {
    return {
      ...state,
      settings: {
        ...state.settings,
        streamingMode: "performance",
      },
    };
  },
  4: (state: RootState): RootState => {
    return {
      ...state,
      uisettings: {
        byName: {
          displayuisettingsbar: { name: 'displayuisettingsbar', value: 'true'},
          gridmode: { name: 'gridmode', value: 'normal'},
          xscolumnsnumber: { name: 'xscolumnsnumber', value: '6'},
          smcolumnsnumber: { name: 'smcolumnsnumber', value: '4'},
          mdcolumnsnumber: { name: 'mdcolumnsnumber', value: '3'},
          listitemheight: { name: 'listitemheight', value: '200px'},
          containerwidth: { name: 'containerwidth', value: 'fixed'}
        },
        allsettings: [
          { name: 'displayuisettingsbar', value: 'true'},
          { name: 'gridmode', value: 'normal'},
          { name: 'xscolumnsnumber', value: '6'},
          { name: 'smcolumnsnumber', value: '4'},
          { name: 'mdcolumnsnumber', value: '3'},
          { name: 'listitemheight', value: '200px'},
          { name: 'containerwidth', value: 'fixed'}
        ]
      }
    };
  },
};

const persistConfig = {
  key: "root",
  version: 5,
  storage,
  whitelist: ["bookmarks", "settings", "uisettings"],
  migrate: createMigrate(migrations, { debug: false }),
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
