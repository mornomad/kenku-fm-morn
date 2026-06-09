import { BrowserWindow, ipcMain } from "electron";

export class WindowManager {
  window: BrowserWindow;
  constructor(window: BrowserWindow) {
    this.window = window;
    ipcMain.on("WINDOW_TOGGLE_MAXIMIZE", this._handleToggleMaximize);
    ipcMain.on("WINDOW_MINIMIZE", this._handleMinimize);
    ipcMain.on("WINDOW_CLOSE", this._handleClose);
    ipcMain.on("SEND_UI_SETTING_TO_SETTINGS_WINDOW", this._handleSendUISettingToSettings);
  }

  destroy() {
    ipcMain.off("WINDOW_TOGGLE_MAXIMIZE", this._handleToggleMaximize);
    ipcMain.off("WINDOW_MINIMIZE", this._handleMinimize);
    ipcMain.off("WINDOW_CLOSE", this._handleClose);
    ipcMain.off("SEND_UI_SETTING_TO_SETTINGS_WINDOW", this._handleSendUISettingToSettings);
  }

  _handleToggleMaximize = (_: Electron.IpcMainEvent) => this.toggleMaximize();

  _handleMinimize = (_: Electron.IpcMainEvent) => this.minimize();

  _handleClose = (_: Electron.IpcMainEvent) => this.close();

  _handleSendUISettingToSettings = (
    _: Electron.IpcMainEvent,
    name: string,
    value: string
  ) => {
    this.window.webContents.send("SEND_UI_SETTING_TO_SETTINGS_WINDOW", name, value);
  };

  toggleMaximize() {
    if (this.window.isMaximized()) {
      this.window.unmaximize();
    } else {
      this.window.maximize();
    }
  }

  minimize() {
    this.window.minimize();
  }

  close() {
    this.window.close();
  }
}
