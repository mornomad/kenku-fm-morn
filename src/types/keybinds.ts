// Shared between the main process (KeybindManager) and the player renderer
// (settings + recorder UI), so the action list, defaults and channel mapping
// can never drift apart.

export type GlobalKeybindAction =
  | "playPause"
  | "nextTrack"
  | "previousTrack"
  | "volumeUp"
  | "volumeDown"
  | "muteToggle";

// Action → Electron accelerator string. An empty string means "unbound".
export type GlobalKeybinds = Record<GlobalKeybindAction, string>;

// "CommandOrControl" maps to Cmd on macOS and Ctrl on Windows/Linux, so one
// accelerator string works on both platforms.
export const defaultGlobalKeybinds: GlobalKeybinds = {
  playPause: "CommandOrControl+Shift+Space",
  nextTrack: "CommandOrControl+Shift+Right",
  previousTrack: "CommandOrControl+Shift+Left",
  volumeUp: "CommandOrControl+Shift+Up",
  volumeDown: "CommandOrControl+Shift+Down",
  muteToggle: "CommandOrControl+Shift+M",
};

// What each action sends to the player view when its shortcut fires.
export const globalKeybindChannels: Record<
  GlobalKeybindAction,
  { channel: string; args?: unknown[] }
> = {
  playPause: { channel: "PLAYER_KEYBIND_PLAYBACK_PLAY_PAUSE" },
  nextTrack: { channel: "PLAYER_REMOTE_PLAYLIST_PLAYBACK_NEXT" },
  previousTrack: { channel: "PLAYER_REMOTE_PLAYLIST_PLAYBACK_PREVIOUS" },
  volumeUp: { channel: "PLAYER_KEYBIND_PLAYBACK_VOLUME_STEP", args: [0.1] },
  volumeDown: { channel: "PLAYER_KEYBIND_PLAYBACK_VOLUME_STEP", args: [-0.1] },
  muteToggle: { channel: "PLAYER_KEYBIND_PLAYBACK_MUTE_TOGGLE" },
};

export const globalKeybindLabels: Record<GlobalKeybindAction, string> = {
  playPause: "Play / pause",
  nextTrack: "Next track",
  previousTrack: "Previous track",
  volumeUp: "Volume up",
  volumeDown: "Volume down",
  muteToggle: "Mute / unmute",
};

// Stable display order for settings UIs.
export const globalKeybindActions: GlobalKeybindAction[] = [
  "playPause",
  "nextTrack",
  "previousTrack",
  "volumeUp",
  "volumeDown",
  "muteToggle",
];
