import React, { useEffect } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";

import { RootState } from "../../app/store";
import {
  adjustVolume,
  mute,
  playPause,
} from "../playlists/playlistPlaybackSlice";

type PlayerKeybindsProps = {
  // Seeks the playing track. Wired to the shared playlist playback in App.
  onSeek: (to: number) => void;
};

// Headless component implementing the keyboard shortcuts:
// - global (OS-wide) ones arrive over IPC from the main process's
//   KeybindManager as toggle/step messages, because only the renderer knows
//   the current playback state;
// - in-app ones (Space, M, arrows) are plain window key events, active while
//   the player UI is focused and the user isn't typing in a field.
export function PlayerKeybinds({ onSeek }: PlayerKeybindsProps) {
  const dispatch = useDispatch();
  // The store handle (not useSelector): handlers read fresh state at event
  // time without re-subscribing this component to every playback tick.
  const store = useStore<RootState>();

  // Keep the main process's global shortcuts in sync with the saved bindings
  // — runs once after rehydrate and again on every change in settings.
  const keybinds = useSelector((state: RootState) => state.settings.keybinds);
  useEffect(() => {
    window.player.setGlobalKeybinds(keybinds);
  }, [keybinds]);

  useEffect(() => {
    function togglePlayPause() {
      const playback = store.getState().playlistPlayback;
      // Nothing loaded yet — nothing to play.
      if (playback.playback) {
        dispatch(playPause(!playback.playing));
      }
    }

    function toggleMute() {
      const playback = store.getState().playlistPlayback;
      dispatch(mute(!playback.muted));
    }

    function stepVolume(delta: number) {
      const playback = store.getState().playlistPlayback;
      const next = Math.min(1, Math.max(0, playback.volume + delta));
      dispatch(adjustVolume(next));
      // Mirror the volume slider: raising the volume implies unmuting.
      if (playback.muted && delta > 0) {
        dispatch(mute(false));
      }
    }

    function seekBy(delta: number) {
      const playback = store.getState().playlistPlayback.playback;
      if (playback) {
        onSeek(Math.min(Math.max(playback.progress + delta, 0), playback.duration));
      }
    }

    // ---- Global shortcuts, forwarded from the main process ----
    window.player.on("PLAYER_KEYBIND_PLAYBACK_PLAY_PAUSE", () => {
      togglePlayPause();
    });
    window.player.on("PLAYER_KEYBIND_PLAYBACK_MUTE_TOGGLE", () => {
      toggleMute();
    });
    window.player.on("PLAYER_KEYBIND_PLAYBACK_VOLUME_STEP", (args) => {
      const delta = args[0];
      if (typeof delta === "number" && Number.isFinite(delta)) {
        stepVolume(delta);
      }
    });

    // ---- In-app keys ----
    function handleKeyDown(event: KeyboardEvent) {
      // Leave modifier combos to the app menu / global shortcuts.
      if (event.metaKey || event.ctrlKey || event.altKey) return;
      // Don't react while the user is typing or an interactive element has
      // focus (buttons handle Space themselves; dnd-kit rows use the arrows).
      const target = document.activeElement as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.tagName === "BUTTON" ||
          target.isContentEditable ||
          target.getAttribute("role") === "button")
      ) {
        return;
      }

      switch (event.key) {
        case " ":
          // preventDefault stops the page from scrolling on Space.
          event.preventDefault();
          togglePlayPause();
          break;
        case "m":
        case "M":
          toggleMute();
          break;
        case "ArrowLeft":
          event.preventDefault();
          seekBy(-10);
          break;
        case "ArrowRight":
          event.preventDefault();
          seekBy(10);
          break;
        case "ArrowUp":
          event.preventDefault();
          stepVolume(0.05);
          break;
        case "ArrowDown":
          event.preventDefault();
          stepVolume(-0.05);
          break;
      }
    }
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.player.removeAllListeners("PLAYER_KEYBIND_PLAYBACK_PLAY_PAUSE");
      window.player.removeAllListeners("PLAYER_KEYBIND_PLAYBACK_MUTE_TOGGLE");
      window.player.removeAllListeners("PLAYER_KEYBIND_PLAYBACK_VOLUME_STEP");
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onSeek, dispatch, store]);

  return <></>;
}
