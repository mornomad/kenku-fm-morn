// Make @discordjs/opus's N-API prebuild visible to Electron.
//
// The package ships a prebuilt binary in a folder named for the Node ABI it
// was installed under (e.g. node-v115-napi-v3-darwin-x64-unknown-unknown).
// N-API binaries are runtime-agnostic, but node-pre-gyp still resolves the
// folder name from the *current* runtime — inside Electron it looks for
// electron-v<major>.<minor>-napi-v3-… and, when that folder is missing,
// prism-media silently falls back to the slow JS opusscript encoder.
// Aliasing the folder lets the native encoder load. Runs via postinstall.
const fs = require("fs");
const path = require("path");

try {
  const electronVersion = require("electron/package.json").version;
  const [major, minor] = electronVersion.split(".");
  const prebuildDir = path.join(
    __dirname,
    "..",
    "node_modules",
    "@discordjs",
    "opus",
    "prebuild"
  );
  const source = fs
    .readdirSync(prebuildDir)
    .find(
      (name) =>
        /^node-v\d+-napi-/.test(name) &&
        name.includes(`${process.platform}-${process.arch}`)
    );
  if (!source) {
    console.warn("[fix-opus-prebuild] no napi prebuild found, skipping");
  } else {
    const target = source.replace(/^node-v\d+/, `electron-v${major}.${minor}`);
    const targetPath = path.join(prebuildDir, target);
    if (fs.existsSync(targetPath)) {
      console.log("[fix-opus-prebuild] alias already present");
    } else {
      fs.cpSync(path.join(prebuildDir, source), targetPath, {
        recursive: true,
      });
      console.log(`[fix-opus-prebuild] aliased ${source} -> ${target}`);
    }
  }
} catch (error) {
  console.warn("[fix-opus-prebuild] skipped:", error.message);
}
