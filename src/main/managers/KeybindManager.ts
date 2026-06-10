import { globalShortcut, ipcMain } from "electron";
import { PlayerManager } from "./PlayerManager";
import {
  defaultGlobalKeybinds,
  GlobalKeybindAction,
  GlobalKeybinds,
  globalKeybindChannels,
} from "../../types/keybinds";

// OS-wide media shortcuts, so playback can be driven while Kenku FM is in the
// background (Discord, a VTT, a browser…). Each shortcut just forwards a
// message to the player view over the same IPC channels the HTTP remote uses;
// the player UI holds all the actual playback state and logic.
//
// Defaults are registered at startup; the player renderer then pushes the
// user's saved bindings (and every later change) over PLAYER_KEYBINDS_SET.
export class KeybindManager {
  private playerManager: PlayerManager;
  // Accelerators we successfully registered, so destroy()/re-apply only
  // touches our own and never another app's.
  private registered: string[] = [];

  constructor(playerManager: PlayerManager) {
    this.playerManager = playerManager;
    ipcMain.on("PLAYER_KEYBINDS_SET", this._handleSetKeybinds);
    this.apply(defaultGlobalKeybinds);
  }

  destroy() {
    ipcMain.off("PLAYER_KEYBINDS_SET", this._handleSetKeybinds);
    this.unregisterAll();
  }

  apply(binds: Partial<GlobalKeybinds>) {
    this.unregisterAll();
    for (const action of Object.keys(
      globalKeybindChannels
    ) as GlobalKeybindAction[]) {
      const accelerator = binds[action] ?? defaultGlobalKeybinds[action];
      // Empty string = deliberately unbound.
      if (!accelerator) continue;
      const { channel, args } = globalKeybindChannels[action];
      try {
        // register() returns false (without throwing) when another app owns
        // the combo; we just lose that one shortcut instead of crashing.
        const ok = globalShortcut.register(accelerator, () => {
          this.playerManager.getView()?.send(channel, ...(args ?? []));
        });
        if (ok) {
          this.registered.push(accelerator);
        }
      } catch {
        // Defensive: an invalid accelerator string shouldn't break startup.
      }
    }
  }

  private unregisterAll() {
    for (const accelerator of this.registered) {
      try {
        globalShortcut.unregister(accelerator);
      } catch {
        // Ignore — nothing useful to do if unregistering fails.
      }
    }
    this.registered = [];
  }

  _handleSetKeybinds = (_: Electron.IpcMainEvent, binds: GlobalKeybinds) => {
    this.apply(binds ?? {});
  };
}
