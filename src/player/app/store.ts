import { combineReducers, configureStore } from "@reduxjs/toolkit";
import playlistsReducer from "../features/playlists/playlistsSlice";
import soundboardsReducer from "../features/soundboards/soundboardsSlice";
import uisettingsReducer from "../common/UISettingsSlice";
import playlsitPlaybackReducer from "../features/playlists/playlistPlaybackSlice";
import soundboardPlaybackReducer from "../features/soundboards/soundboardPlaybackSlice";
import settingsReducer from "../features/settings/settingsSlice";

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

// Runs when a saved store from an older version is loaded. Version 2 introduces
// tags: every existing track needs a `tagIds` array and the playlists slice
// needs an empty `tags` map. We type the state as `any` here because it is
// whatever shape was persisted before this code existed.
const migrations = {
  2: (state: any) => {
    if (!state?.playlists) {
      return state;
    }
    const oldTracks = state.playlists.tracks ?? {};
    const tracks: Record<string, any> = {};
    for (const [id, track] of Object.entries(oldTracks)) {
      tracks[id] = { ...(track as object), tagIds: [] };
    }
    return {
      ...state,
      playlists: {
        ...state.playlists,
        tracks,
        tags: state.playlists.tags ?? { byId: {}, allIds: [] },
      },
    };
  },
  3: (state: any) => {
    return {
      ...state,
      uisettings: state.uisettings ?? {
        byName: {},
        allSettings: [
          { name: 'gridmode', value: 'normal'},
          { name: 'containerwidth', value: 'fixed'}
        ]
      }
    };
  }

};

const playbackPersistConfig = {
  key: "playback",
  version: 1,
  storage,
  whitelist: ["volume", "muted", "shuffle", "repeat"],
};

const rootReducer = combineReducers({
  playlists: playlistsReducer,
  soundboards: soundboardsReducer,
  uisettings: uisettingsReducer,
  playlistPlayback: persistReducer(
    playbackPersistConfig,
    playlsitPlaybackReducer
  ),
  soundboardPlayback: soundboardPlaybackReducer,
  settings: settingsReducer,
});

const persistConfig = {
  key: "player",
  version: 3,
  storage,
  whitelist: ["playlists", "soundboards", "settings", "uisettings"],
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
