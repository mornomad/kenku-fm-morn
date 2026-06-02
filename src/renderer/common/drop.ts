import Case from "case";

export function encodeFilePath(path: string) {
  // Serve local files through our custom protocol (registered in src/index.ts)
  // so they load with webSecurity on, in both dev (http origin) and packaged
  // builds. The whole absolute path is kept as one percent-encoded segment
  // after the "local" host, and decoded back to a path in the main process.
  return `kenku-media://local/${encodeURIComponent(path)}`;
}

export function getDropURL(dataTransfer: DataTransfer): string | undefined {
  const files: FileList = dataTransfer.files;
  if (files.length > 0) {
    const file = files[0];
    const path = window.player.getPathForFile(file);
    if (path) {
      return encodeFilePath(path);
    }
  }
}

export function cleanFileName(name: string): string {
  // Remove file extension
  let clean = name.substring(0, name.lastIndexOf(".")) || name;
  // Clean string
  clean = clean.replace(/ +/g, " ");
  clean = clean.trim();
  // Capitalize and remove underscores
  clean = Case.capital(clean);

  return clean;
}
