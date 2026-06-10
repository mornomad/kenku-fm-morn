import os from "os";
import fs from "fs";
import { Readable } from "stream";
import {
  app,
  BrowserWindow,
  components,
  dialog,
  globalShortcut,
  protocol,
  session,
  shell,
  ipcMain,
  powerSaveBlocker,
} from "electron";
import "./menu";
import icon from "./assets/icon.png";
import { getMalformedUserAgent, getUserAgent } from "./main/userAgent";
import { getEmbeddedThumbnail } from "./main/thumbnails";
import { SessionManager } from "./main/managers/SessionManager";
import { runAutoUpdate } from "./autoUpdate";
import { getSavedBounds, saveWindowBounds } from "./bounds";

declare const MAIN_WINDOW_WEBPACK_ENTRY: string;
declare const MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY: string;

// Register a custom protocol so the player can load local audio/image files
// with webSecurity on. In dev the UI is served from http://localhost, which
// blocks file:// resources (the cause of "Unable to play track"); serving the
// files through kenku-media:// sidesteps that in both dev and packaged builds.
// Must be called before the app is ready.
protocol.registerSchemesAsPrivileged([
  {
    scheme: "kenku-media",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      stream: true,
    },
  },
]);

// Content types for files served over kenku-media:// (audio tracks and the
// image backgrounds). A correct Content-Type helps the media element decode.
const mediaMimeTypes: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".m4a": "audio/mp4",
  ".mp4": "audio/mp4",
  ".aac": "audio/aac",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".oga": "audio/ogg",
  ".opus": "audio/ogg",
  ".flac": "audio/flac",
  ".webm": "audio/webm",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".bmp": "image/bmp",
  ".svg": "image/svg+xml",
};

const getMediaMimeType = (filePath: string): string => {
  const ext = filePath.slice(filePath.lastIndexOf(".")).toLowerCase();
  return mediaMimeTypes[ext] ?? "application/octet-stream";
};

const hasSingleInstanceLock = app.requestSingleInstanceLock();
let window: BrowserWindow | null = null;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require("electron-squirrel-startup")) {
  // eslint-disable-line global-require
  app.quit();
}

const createWindow = (): BrowserWindow => {
  const minWidth = 800;
  const minHeight = 600;

  // Create the browser window.
  const { bounds, maximized } = getSavedBounds(minWidth, minHeight);

  const mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: MAIN_WINDOW_PRELOAD_WEBPACK_ENTRY,
    },
    titleBarStyle: "hidden",
    trafficLightPosition: { x: 16, y: 18 },
    icon: icon,
    minWidth,
    minHeight,
    ...bounds,
  });

  if (maximized) {
    mainWindow.maximize();
  }

  // and load the index.html of the app.
  mainWindow.loadURL(MAIN_WINDOW_WEBPACK_ENTRY);

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url);
    return { action: "deny" };
  });

  let session = new SessionManager(mainWindow);

  mainWindow.webContents.on("did-start-loading", () => {
    // Restart the session on refresh
    session.destroy();
    session = new SessionManager(mainWindow);
  });

  // Spoof user agent for window.navigator
  mainWindow.webContents.setUserAgent(getUserAgent());

  // Prevent app suspension for Kenku FM to avoid playback issues
  const powerSaveBlockerId = powerSaveBlocker.start("prevent-app-suspension");

  mainWindow.on("close", () => {
    session.destroy();
    window = null;
    powerSaveBlocker.stop(powerSaveBlockerId);
  });

  saveWindowBounds(mainWindow);

  if (app.isPackaged) {
    runAutoUpdate(mainWindow);
  }

  return mainWindow;
};

const spoofUserAgent = () => {
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    // Google blocks sign in on CEF so spoof user agent for network requests
    details.requestHeaders["User-Agent"] = details.url.includes("google.com")
      ? getMalformedUserAgent()
      : getUserAgent();
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });
};

if (!hasSingleInstanceLock) {
  app.quit();
} else {
  // Workaround to allow for webpack support with widevine
  // https://github.com/castlabs/electron-releases/issues/116
  const widevine = components;

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.whenReady().then(async () => {
    // Serve local files requested as kenku-media://local/<percent-encoded-path>.
    // We implement HTTP Range requests so the player can seek: a media element
    // only treats a source as seekable when the server answers ranges with a
    // 206 response and an Accept-Ranges header.
    protocol.handle("kenku-media", async (request) => {
      const url = new URL(request.url);
      // The absolute path is a single encoded segment after the host.
      const filePath = decodeURIComponent(url.pathname.replace(/^\//, ""));

      // kenku-media://thumb/<audio path> → the file's embedded cover art, or
      // 404 if it has none (the UI then shows a fallback icon).
      if (url.host === "thumb") {
        const thumb = await getEmbeddedThumbnail(filePath);
        if (!thumb) {
          return new Response("Not Found", { status: 404 });
        }
        // Wrap in a plain Uint8Array so it's accepted as a Response body
        // (Node's Buffer type doesn't line up with the DOM BodyInit type).
        return new Response(new Uint8Array(thumb.data), {
          status: 200,
          headers: {
            "Content-Type": thumb.mime,
            // Let the renderer's HTTP cache reuse the image across row
            // mounts instead of round-tripping to this handler every time.
            "Cache-Control": "public, max-age=86400",
          },
        });
      }

      let size: number;
      try {
        size = (await fs.promises.stat(filePath)).size;
      } catch {
        return new Response("Not Found", { status: 404 });
      }

      const mimeType = getMediaMimeType(filePath);
      const range = request.headers.get("Range");

      if (range) {
        // Parse "bytes=start-end" (either side may be omitted).
        const match = /bytes=(\d*)-(\d*)/.exec(range);
        let start = match && match[1] ? parseInt(match[1], 10) : 0;
        let end = match && match[2] ? parseInt(match[2], 10) : size - 1;
        if (!Number.isFinite(start) || start < 0) start = 0;
        if (!Number.isFinite(end) || end >= size) end = size - 1;
        if (start > end) start = end;
        const stream = fs.createReadStream(filePath, { start, end });
        return new Response(Readable.toWeb(stream) as unknown as ReadableStream, {
          status: 206,
          headers: {
            "Content-Type": mimeType,
            "Content-Length": String(end - start + 1),
            "Content-Range": `bytes ${start}-${end}/${size}`,
            "Accept-Ranges": "bytes",
          },
        });
      }

      const stream = fs.createReadStream(filePath);
      return new Response(Readable.toWeb(stream) as unknown as ReadableStream, {
        status: 200,
        headers: {
          "Content-Type": mimeType,
          "Content-Length": String(size),
          "Accept-Ranges": "bytes",
        },
      });
    });

    let hasWidevineError = false;

    try {
      // Wait for widevine to load
      await widevine.whenReady();
      console.log("components ready:", components.status());
    } catch (e) {
      hasWidevineError = true;
      console.error("components failed to load:", JSON.stringify(e, null, 2));
    }

    window = createWindow();

    spoofUserAgent();

    if (hasWidevineError) {
      window.once("ready-to-show", () => {
        window.webContents.send(
          "ERROR",
          "Widevine DRM Error: Licensed music playback is disabled",
        );
      });
    }
  });

  app.on("second-instance", () => {
    // Someone tried to run a second instance, we should focus our window.
    if (window) {
      if (window.isMinimized()) {
        window.restore();
      }
      window.focus();
    }
  });

  // Belt-and-braces: make sure no global keybinds outlive the app.
  app.on("will-quit", () => {
    globalShortcut.unregisterAll();
  });

  // Quit when all windows are closed, except on macOS. There, it's common
  // for applications and their menu bar to stay active until the user quits
  // explicitly with Cmd + Q.
  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
      app.quit();
    }
  });

  app.on("activate", () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      window = createWindow();
    }
  });

  ipcMain.on("GET_VERSION", (event) => {
    event.returnValue = app.getVersion();
  });

  ipcMain.on("GET_PLATFORM", (event) => {
    event.returnValue = os.platform();
  });

  ipcMain.handle("PLAYER_SHOW_OPEN_IMAGE_DIALOG", async () => {
    const result = await dialog.showOpenDialog({
      properties: ["openFile"],
      filters: [
        {
          name: "Images",
          extensions: ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"],
        },
      ],
    });
    if (result.canceled || result.filePaths.length === 0) {
      return undefined;
    }
    return result.filePaths[0];
  });

  ipcMain.handle("CLEAR_CACHE", async () => {
    await session.defaultSession.clearCache();
    await session.defaultSession.clearStorageData({
      storages: ["cookies", "shadercache", "cachestorage"],
    });
  });
}
