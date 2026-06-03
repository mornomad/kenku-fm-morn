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
