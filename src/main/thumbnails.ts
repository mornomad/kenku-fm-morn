import jsmediatags from "jsmediatags";
import type { TagResult } from "jsmediatags";

export interface EmbeddedThumbnail {
  mime: string;
  data: Buffer;
}

// Cache the result per file path so we only parse each file once per session.
// A cached `null` means "parsed, but this file has no embedded art".
const cache = new Map<string, EmbeddedThumbnail | null>();

function readTags(filePath: string): Promise<TagResult> {
  return new Promise((resolve, reject) => {
    jsmediatags.read(filePath, { onSuccess: resolve, onError: reject });
  });
}

// Extract the embedded cover art from an audio file (ID3 for mp3, the picture
// block in flac, the cover atom in m4a, …). Returns null if there's no art or
// the file can't be parsed.
export async function getEmbeddedThumbnail(
  filePath: string,
): Promise<EmbeddedThumbnail | null> {
  const cached = cache.get(filePath);
  if (cached !== undefined) {
    return cached;
  }
  let result: EmbeddedThumbnail | null = null;
  try {
    const tag = await readTags(filePath);
    const picture = tag?.tags?.picture;
    if (picture && picture.format && picture.data && picture.data.length > 0) {
      result = { mime: picture.format, data: Buffer.from(picture.data) };
    }
  } catch {
    result = null;
  }
  cache.set(filePath, result);
  return result;
}
