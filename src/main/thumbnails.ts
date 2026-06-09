import fs from "fs";
import path from "path";
import { nativeImage } from "electron";
import jsmediatags from "jsmediatags";
import type { TagResult } from "jsmediatags";

export interface EmbeddedThumbnail {
  mime: string;
  data: Buffer;
}

// Embedded art is often 1000px+ JPEGs but is displayed at ~40-56px; serve a
// downscaled copy so the renderer doesn't decode and hold megapixel images
// for every row. 128px covers the largest display size at 2x density.
const THUMBNAIL_SIZE = 128;

// Cache the result per file path so we only parse each file once per session.
// A cached `null` means "parsed, but this file has no embedded art". The
// cache holds the downscaled bytes, so it stays small.
const cache = new Map<string, EmbeddedThumbnail | null>();

// Resize to THUMBNAIL_SIZE on the long edge. Falls back to the original
// bytes for formats nativeImage can't decode.
function downscale(thumb: EmbeddedThumbnail): EmbeddedThumbnail {
  try {
    const image = nativeImage.createFromBuffer(thumb.data);
    if (image.isEmpty()) return thumb;
    const { width, height } = image.getSize();
    if (Math.max(width, height) <= THUMBNAIL_SIZE) return thumb;
    const resized =
      width >= height
        ? image.resize({ width: THUMBNAIL_SIZE })
        : image.resize({ height: THUMBNAIL_SIZE });
    return { mime: "image/jpeg", data: resized.toJPEG(85) };
  } catch {
    return thumb;
  }
}

function readTags(filePath: string): Promise<TagResult> {
  return new Promise((resolve, reject) => {
    jsmediatags.read(filePath, { onSuccess: resolve, onError: reject });
  });
}

// Plain image files (e.g. custom playlist covers) served through the thumb
// route get the same downscale treatment as embedded art.
const IMAGE_EXTENSIONS = new Set([
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".bmp",
]);

const IMAGE_MIME: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".bmp": "image/bmp",
};

// Produce a small thumbnail for a file: embedded cover art for audio files
// (ID3 for mp3, the picture block in flac, the cover atom in m4a, …) or a
// downscaled copy of the file itself when it's an image. Returns null if
// there's nothing to show or the file can't be parsed.
export async function getEmbeddedThumbnail(
  filePath: string,
): Promise<EmbeddedThumbnail | null> {
  const cached = cache.get(filePath);
  if (cached !== undefined) {
    return cached;
  }
  let result: EmbeddedThumbnail | null = null;
  const extension = path.extname(filePath).toLowerCase();
  try {
    if (IMAGE_EXTENSIONS.has(extension)) {
      result = downscale({
        mime: IMAGE_MIME[extension],
        data: await fs.promises.readFile(filePath),
      });
    } else {
      const tag = await readTags(filePath);
      const picture = tag?.tags?.picture;
      if (
        picture &&
        picture.format &&
        picture.data &&
        picture.data.length > 0
      ) {
        result = downscale({
          mime: picture.format,
          data: Buffer.from(picture.data),
        });
      }
    }
  } catch {
    result = null;
  }
  cache.set(filePath, result);
  return result;
}
