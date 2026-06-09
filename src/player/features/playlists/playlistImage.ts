import { Playlist } from "./playlistsSlice";
import { backgrounds, isBackground } from "../../backgrounds";

// The displayable image URL for a playlist's background — either a built-in
// background (resolved from its key) or a custom image URL. Used as the
// fallback cover for tracks that have no art of their own.
export function playlistImageUrl(
  playlist: Playlist | undefined,
): string | undefined {
  if (!playlist || !playlist.background) {
    return undefined;
  }
  return isBackground(playlist.background)
    ? backgrounds[playlist.background]
    : playlist.background;
}

const LOCAL_PREFIX = "kenku-media://local/";
const THUMB_PREFIX = "kenku-media://thumb/";

// Like playlistImageUrl, but local custom images are served through the
// thumb route, which downscales them in the main process. Use this for the
// SMALL display sites (track-row fallback covers, the player bar) so a
// multi-megabyte custom cover isn't decoded at full size for a 40px slot.
// Built-in backgrounds are bundled assets and pass through unchanged.
export function playlistImageThumbUrl(
  playlist: Playlist | undefined,
): string | undefined {
  const url = playlistImageUrl(playlist);
  if (url?.startsWith(LOCAL_PREFIX)) {
    return THUMB_PREFIX + url.slice(LOCAL_PREFIX.length);
  }
  return url;
}
