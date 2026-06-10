import { combineReducers, configureStore } from "@reduxjs/toolkit";
import playlistsReducer from "../features/playlists/playlistsSlice";
import soundboardsReducer from "../features/soundboards/soundboardsSlice";
import uisettingsReducer from "../common/UISettingsSlice";
import playlsitPlaybackReducer from "../features/playlists/playlistPlaybackSlice";
import soundboardPlaybackReducer from "../features/soundboards/soundboardPlaybackSlice";
import settingsReducer from "../features/settings/settingsSlice";
import { defaultGlobalKeybinds } from "../../types/keybinds";

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
        byName: {
          gridmode: { name: 'gridmode', value: 'normal'},
          xscolumnsnumber: { name: 'xscolumnsnumber', value: '6'},
          smcolumnsnumber: { name: 'smcolumnsnumber', value: '4'},
          mdcolumnsnumber: { name: 'mdcolumnsnumber', value: '3'},
          listitemheight: { name: 'listitemheight', value: '200px'},
          containerwidth: { name: 'containerwidth', value: 'fixed'}
        },
        allsettings: [
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
  // Version 4: the timeline waveform settings appear, and the single search
  // bar becomes the default. Persisted settings replace initialState wholesale
  // on rehydrate, so new keys must be seeded here or they'd come back
  // undefined for existing installs.
  4: (state: any) => {
    return {
      ...state,
      settings: {
        ...(state?.settings ?? {}),
        searchMode: "unified",
        timelineStyle: state?.settings?.timelineStyle ?? "bars",
        waveformReflection: state?.settings?.waveformReflection ?? true,
      },
    };
  },
  // Version 5: the play queue (an ordered cross-playlist list of track ids)
  // joins the playlists slice.
  5: (state: any) => {
    if (!state?.playlists) {
      return state;
    }
    return {
      ...state,
      playlists: {
        ...state.playlists,
        queue: state.playlists.queue ?? [],
      },
    };
  },
  // Version 6: customizable global keybinds join the settings slice.
  6: (state: any) => {
    return {
      ...state,
      settings: {
        ...(state?.settings ?? {}),
        keybinds: {
          ...defaultGlobalKeybinds,
          ...(state?.settings?.keybinds ?? {}),
        },
      },
    };
  },
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
  version: 6,
  storage,
  whitelist: ["playlists", "soundboards", "settings", "uisettings"],
  migrate: createMigrate(migrations, { debug: false }),
  // Batch storage writes: persisting serializes the entire library, so
  // action bursts (drag reorders, bulk tag edits) shouldn't re-stringify
  // everything once per action.
  throttle: 1000,
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
