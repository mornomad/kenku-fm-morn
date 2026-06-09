import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface Track {
  id: string;
  url: string;
  title: string;
  // Ids of the tags applied to this track. They point into the `tags` map
  // below — the track never stores tag names or colors directly, only the ids.
  tagIds: string[];
  // Optional custom cover image (a kenku-media:// or http URL). When unset, the
  // UI derives the cover from the file's embedded art. Optional, so existing
  // tracks and the two creation sites don't need to set it.
  thumbnail?: string;
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
  // Tags automatically applied to tracks added to this playlist. Optional, so
  // existing playlists and creation sites don't need to set it.
  defaultTagIds?: string[];
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
  // The play queue: an ordered list of track ids hand-picked from any
  // playlist, played and looped as its own list. No duplicates.
  queue: string[];
}

// The sentinel "playlist id" used when playback is started from the queue.
// Real playlists use uuids, so this can never collide with one.
export const QUEUE_PLAYLIST_ID = "queue";

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
  queue: [],
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
      const removed = new Set(state.playlists.byId[action.payload].tracks);
      for (let track of state.playlists.byId[action.payload].tracks) {
        delete state.tracks[track];
      }
      delete state.playlists.byId[action.payload];
      state.playlists.allIds = state.playlists.allIds.filter(
        (id) => id !== action.payload
      );
      state.queue = state.queue.filter((id) => !removed.has(id));
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
      const playlist = state.playlists.byId[playlistId];
      playlist.tracks.unshift(track.id);
      // Apply the playlist's default tags to the new track (deduped).
      const defaults = playlist.defaultTagIds ?? [];
      state.tracks[track.id] = {
        ...track,
        tagIds: Array.from(new Set([...track.tagIds, ...defaults])),
      };
    },
    addTracks: (
      state,
      action: PayloadAction<{ tracks: Track[]; playlistId: string }>
    ) => {
      const { tracks, playlistId } = action.payload;
      const playlist = state.playlists.byId[playlistId];
      playlist.tracks.unshift(...tracks.map((track) => track.id));
      const defaults = playlist.defaultTagIds ?? [];
      for (let track of tracks) {
        state.tracks[track.id] = {
          ...track,
          tagIds: Array.from(new Set([...track.tagIds, ...defaults])),
        };
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
      state.queue = state.queue.filter((id) => id !== trackId);
    },
    removeTracks: (
      state,
      action: PayloadAction<{ trackIds: string[]; playlistId: string }>
    ) => {
      const { trackIds, playlistId } = action.payload;
      const remove = new Set(trackIds);
      const playlist = state.playlists.byId[playlistId];
      if (playlist) {
        playlist.tracks = playlist.tracks.filter((id) => !remove.has(id));
      }
      for (const id of trackIds) {
        delete state.tracks[id];
      }
      state.queue = state.queue.filter((id) => !remove.has(id));
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
    // Append tracks to the play queue. Skips ids already queued (no
    // duplicates) and ids that don't resolve to a real track.
    addToQueue: (state, action: PayloadAction<{ trackIds: string[] }>) => {
      for (const id of action.payload.trackIds) {
        if (state.tracks[id] && !state.queue.includes(id)) {
          state.queue.push(id);
        }
      }
    },
    removeFromQueue: (state, action: PayloadAction<string>) => {
      state.queue = state.queue.filter((id) => id !== action.payload);
    },
    clearQueue: (state) => {
      state.queue = [];
    },
    // Drag-reorder within the queue (same active/over shape as moveTrack).
    moveQueueItem: (
      state,
      action: PayloadAction<{ active: string; over: string }>
    ) => {
      const oldIndex = state.queue.indexOf(action.payload.active);
      const newIndex = state.queue.indexOf(action.payload.over);
      state.queue.splice(oldIndex, 1);
      state.queue.splice(newIndex, 0, action.payload.active);
    },
    // Relocate a track to a different playlist. The Track entry in the global
    // map is untouched — we just move its id from one playlist's list to
    // another's, so there's no duplication.
    moveTrackToPlaylist: (
      state,
      action: PayloadAction<{
        trackId: string;
        fromPlaylistId: string;
        toPlaylistId: string;
      }>
    ) => {
      const { trackId, fromPlaylistId, toPlaylistId } = action.payload;
      if (fromPlaylistId === toPlaylistId) return;
      const from = state.playlists.byId[fromPlaylistId];
      const to = state.playlists.byId[toPlaylistId];
      if (!from || !to) return;
      from.tracks = from.tracks.filter((id) => id !== trackId);
      if (!to.tracks.includes(trackId)) {
        to.tracks.unshift(trackId);
      }
    },
    // Move several tracks to another playlist at once (bulk). Like
    // moveTrackToPlaylist but for a set of ids — global map untouched.
    moveTracksToPlaylist: (
      state,
      action: PayloadAction<{
        trackIds: string[];
        fromPlaylistId: string;
        toPlaylistId: string;
      }>
    ) => {
      const { trackIds, fromPlaylistId, toPlaylistId } = action.payload;
      if (fromPlaylistId === toPlaylistId) return;
      const from = state.playlists.byId[fromPlaylistId];
      const to = state.playlists.byId[toPlaylistId];
      if (!from || !to) return;
      const moving = new Set(trackIds);
      from.tracks = from.tracks.filter((id) => !moving.has(id));
      const toAdd = trackIds.filter((id) => !to.tracks.includes(id));
      to.tracks.unshift(...toAdd);
    },
    // Duplicate a track into another playlist as an independent copy (new id),
    // so editing one doesn't affect the other. The caller supplies the new id.
    copyTrackToPlaylist: (
      state,
      action: PayloadAction<{
        trackId: string;
        toPlaylistId: string;
        newTrackId: string;
      }>
    ) => {
      const { trackId, toPlaylistId, newTrackId } = action.payload;
      const source = state.tracks[trackId];
      const to = state.playlists.byId[toPlaylistId];
      if (!source || !to) return;
      state.tracks[newTrackId] = {
        ...source,
        id: newTrackId,
        tagIds: [...source.tagIds],
      };
      to.tracks.unshift(newTrackId);
    },
    // Add and/or remove a set of tags across many tracks at once (bulk edit).
    tagTracks: (
      state,
      action: PayloadAction<{
        trackIds: string[];
        addTagIds: string[];
        removeTagIds: string[];
      }>
    ) => {
      const { trackIds, addTagIds, removeTagIds } = action.payload;
      for (const id of trackIds) {
        const track = state.tracks[id];
        if (!track) continue;
        const next = new Set(track.tagIds);
        for (const tagId of addTagIds) next.add(tagId);
        for (const tagId of removeTagIds) next.delete(tagId);
        track.tagIds = Array.from(next);
      }
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
      // Also drop it from any playlist's default tags.
      for (const playlist of Object.values(state.playlists.byId)) {
        if (playlist.defaultTagIds?.includes(tagId)) {
          playlist.defaultTagIds = playlist.defaultTagIds.filter(
            (id) => id !== tagId
          );
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
  removeTracks,
  editTrack,
  moveTrack,
  moveTrackToPlaylist,
  moveTracksToPlaylist,
  copyTrackToPlaylist,
  tagTracks,
  addTag,
  editTag,
  removeTag,
  addToQueue,
  removeFromQueue,
  clearQueue,
  moveQueueItem,
} = playlistsSlice.actions;

export default playlistsSlice.reducer;
