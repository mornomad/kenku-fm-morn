import { Track } from "./playlistsSlice";

const LOCAL_PREFIX = "kenku-media://local/";
const THUMB_PREFIX = "kenku-media://thumb/";

// Stored in track.thumbnail to mean "use the playlist's image" (a dynamic
// reference, so it stays in sync if the playlist background changes).
export const INHERIT_PLAYLIST = "inherit:playlist";

// The primary image URL for a track:
// 1. the inherit sentinel → the playlist's image, otherwise
// 2. a manually-set custom thumbnail, otherwise
// 3. for local files, the embedded cover art (thumb protocol route), otherwise
// 4. nothing (the UI then falls back to the playlist image, then an icon).
export function trackThumbnailUrl(
  track: Track,
  playlistImage?: string,
): string | undefined {
  if (track.thumbnail === INHERIT_PLAYLIST) {
    return playlistImage;
  }
  if (track.thumbnail) {
    return track.thumbnail;
  }
  if (track.url.startsWith(LOCAL_PREFIX)) {
    return THUMB_PREFIX + track.url.slice(LOCAL_PREFIX.length);
  }
  return undefined;
}
