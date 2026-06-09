import { useEffect, useState } from "react";

// Number of amplitude samples computed per track. The canvas re-buckets these
// down to however many bars fit on screen, so this just needs to comfortably
// exceed the widest realistic player window.
const PEAK_COUNT = 2000;

// Decode at a low sample rate: we only need the amplitude envelope, not
// listenable audio. 8 kHz cuts the transient decoded-PCM memory ~5x compared
// to decoding at the hardware rate.
const DECODE_SAMPLE_RATE = 8000;

// Skip files bigger than this (compressed size). Decoding a multi-hour file
// can transiently allocate hundreds of MB of PCM; those tracks just keep the
// plain slider.
const MAX_FILE_BYTES = 100 * 1024 * 1024;

// Computed peaks per track url. null = tried and unavailable (remote url,
// decode failure…) so callers fall back to the plain slider. Entries are
// ~8 KB each, so the cache stays tiny even for large libraries.
const peakCache = new Map<string, Float32Array | null>();
// In-flight decodes, so a component re-rendering mid-decode doesn't kick off
// a second decode of the same file.
const pending = new Map<string, Promise<Float32Array | null>>();

function computePeaks(audio: AudioBuffer, count: number): Float32Array {
  const peaks = new Float32Array(count);
  const length = audio.length;
  const samplesPerPeak = Math.max(1, Math.floor(length / count));
  for (let channel = 0; channel < audio.numberOfChannels; channel++) {
    const data = audio.getChannelData(channel);
    for (let i = 0; i < count; i++) {
      const start = i * samplesPerPeak;
      const end = Math.min(start + samplesPerPeak, length);
      let max = 0;
      for (let j = start; j < end; j++) {
        const value = Math.abs(data[j]);
        if (value > max) max = value;
      }
      if (max > peaks[i]) peaks[i] = max;
    }
  }
  // Normalize so the loudest point fills the full height — quiet ambience
  // tracks still get a readable shape.
  let loudest = 0;
  for (let i = 0; i < count; i++) {
    if (peaks[i] > loudest) loudest = peaks[i];
  }
  if (loudest > 0) {
    for (let i = 0; i < count; i++) {
      peaks[i] /= loudest;
    }
  }
  return peaks;
}

async function decodePeaks(url: string): Promise<Float32Array | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    const buffer = await response.arrayBuffer();
    if (buffer.byteLength > MAX_FILE_BYTES) return null;
    // OfflineAudioContext lets us pick the decode sample rate (a plain
    // AudioContext always decodes at the hardware rate).
    const context = new OfflineAudioContext(1, 1, DECODE_SAMPLE_RATE);
    const audio = await context.decodeAudioData(buffer);
    return computePeaks(audio, PEAK_COUNT);
  } catch {
    return null;
  }
}

function loadPeaks(url: string): Promise<Float32Array | null> {
  const inFlight = pending.get(url);
  if (inFlight) return inFlight;
  const promise = decodePeaks(url).then((peaks) => {
    peakCache.set(url, peaks);
    pending.delete(url);
    return peaks;
  });
  pending.set(url, promise);
  return promise;
}

/**
 * Waveform peaks for a track url.
 * - undefined: still decoding — show the plain slider for now.
 * - null: not available for this url (remote file, too large, decode failure)
 *   — keep the plain slider.
 * - Float32Array: ready — render the waveform.
 */
export function usePeaks(
  url: string | undefined
): Float32Array | null | undefined {
  const [peaks, setPeaks] = useState<Float32Array | null | undefined>(() =>
    url ? peakCache.get(url) : null
  );

  useEffect(() => {
    // Only local files served over the kenku-media protocol: a remote url
    // would need a full download (and may be CORS-blocked), so those keep
    // the slider.
    if (!url || !url.startsWith("kenku-media://local/")) {
      setPeaks(null);
      return;
    }
    const cached = peakCache.get(url);
    if (cached !== undefined) {
      setPeaks(cached);
      return;
    }
    // Don't apply a stale result if the track changed mid-decode.
    let cancelled = false;
    setPeaks(undefined);
    loadPeaks(url).then((result) => {
      if (!cancelled) setPeaks(result);
    });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return peaks;
}
