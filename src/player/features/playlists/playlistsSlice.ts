import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Track {
  id: string;
  url: string;
  title: string;
  // Ids of the tags applied to this track. They point into the `tags` map
  // below — the track never stores tag names or colors directly, only the ids.
  tagIds: string[];
}

// A tag is its own entity with a stable id. The id never changes, so a track's
// reference stays valid even when the tag is renamed or recolored.
export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Playlist {
  tracks: string[];
  background: string;
  title: string;
  id: string;
}

export interface PlaylistsState {
  playlists: {
    byId: Record<string, Playlist>;
    allIds: string[];
  };
  tracks: Record<string, Track>;
  // Every tag in the app lives here once, keyed by id (same byId/allIds shape
  // the playlists use). `allIds` gives the tags a stable display order.
  tags: {
    byId: Record<string, Tag>;
    allIds: string[];
  };
}

const initialState: PlaylistsState = {
  playlists: {
    byId: {},
    allIds: [],
  },
  tracks: {},
  tags: {
    byId: {},
    allIds: [],
  },
};

export const playlistsSlice = createSlice({
  name: "playlists",
  initialState,
  reducers: {
    addPlaylist: (state, action: PayloadAction<Playlist>) => {
      state.playlists.byId[action.payload.id] = action.payload;
      state.playlists.allIds.push(action.payload.id);
    },
    removePlaylist: (state, action: PayloadAction<string>) => {
      for (let track of state.playlists.byId[action.payload].tracks) {
        delete state.tracks[track];
      }
      delete state.playlists.byId[action.payload];
      state.playlists.allIds = state.playlists.allIds.filter(
        (id) => id !== action.payload
      );
    },
    editPlaylist: (state, action: PayloadAction<Partial<Playlist>>) => {
      if (!action.payload.id) {
        throw Error("Id needed in editPlaylist payload");
      }
      state.playlists.byId[action.payload.id] = {
        ...state.playlists.byId[action.payload.id],
        ...action.payload,
      };
    },
    addTrack: (
      state,
      action: PayloadAction<{ track: Track; playlistId: string }>
    ) => {
      const { track, playlistId } = action.payload;
      state.playlists.byId[playlistId].tracks.unshift(track.id);
      state.tracks[track.id] = track;
    },
    addTracks: (
      state,
      action: PayloadAction<{ tracks: Track[]; playlistId: string }>
    ) => {
      const { tracks, playlistId } = action.payload;
      state.playlists.byId[playlistId].tracks.unshift(
        ...tracks.map((track) => track.id)
      );
      for (let track of tracks) {
        state.tracks[track.id] = track;
      }
    },
    removeTrack: (
      state,
      action: PayloadAction<{ trackId: string; playlistId: string }>
    ) => {
      const { trackId, playlistId } = action.payload;
      state.playlists.byId[playlistId].tracks = state.playlists.byId[
        playlistId
      ].tracks.filter((id) => id !== trackId);
      delete state.tracks[trackId];
    },
    editTrack: (state, action: PayloadAction<Partial<Track>>) => {
      if (!action.payload.id) {
        throw Error("Id needed in editTrack payload");
      }
      state.tracks[action.payload.id] = {
        ...state.tracks[action.payload.id],
        ...action.payload,
      };
    },
    movePlaylist: (
      state,
      action: PayloadAction<{ active: string; over: string }>
    ) => {
      const oldIndex = state.playlists.allIds.indexOf(action.payload.active);
      const newIndex = state.playlists.allIds.indexOf(action.payload.over);
      state.playlists.allIds.splice(oldIndex, 1);
      state.playlists.allIds.splice(newIndex, 0, action.payload.active);
    },
    moveTrack: (
      state,
      action: PayloadAction<{
        playlistId: string;
        active: string;
        over: string;
      }>
    ) => {
      const playlist = state.playlists.byId[action.payload.playlistId];
      const oldIndex = playlist.tracks.indexOf(action.payload.active);
      const newIndex = playlist.tracks.indexOf(action.payload.over);
      playlist.tracks.splice(oldIndex, 1);
      playlist.tracks.splice(newIndex, 0, action.payload.active);
    },
    addTag: (state, action: PayloadAction<Tag>) => {
      state.tags.byId[action.payload.id] = action.payload;
      state.tags.allIds.push(action.payload.id);
    },
    editTag: (state, action: PayloadAction<Partial<Tag>>) => {
      if (!action.payload.id) {
        throw Error("Id needed in editTag payload");
      }
      state.tags.byId[action.payload.id] = {
        ...state.tags.byId[action.payload.id],
        ...action.payload,
      };
    },
    removeTag: (state, action: PayloadAction<string>) => {
      const tagId = action.payload;
      delete state.tags.byId[tagId];
      state.tags.allIds = state.tags.allIds.filter((id) => id !== tagId);
      // A tag id may be referenced by any number of tracks, so deleting the tag
      // means walking every track and stripping the now-dangling id. This is the
      // bookkeeping cost of the normalized design.
      for (const track of Object.values(state.tracks)) {
        if (track.tagIds.includes(tagId)) {
          track.tagIds = track.tagIds.filter((id) => id !== tagId);
        }
      }
    },
  },
});

export const {
  addPlaylist,
  removePlaylist,
  editPlaylist,
  movePlaylist,
  addTrack,
  addTracks,
  removeTrack,
  editTrack,
  moveTrack,
  addTag,
  editTag,
  removeTag,
} = playlistsSlice.actions;

export default playlistsSlice.reducer;
