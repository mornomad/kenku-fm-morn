import React, { useEffect, useRef, useState } from "react";
import Box from "@mui/material/Box";
import { useTheme } from "@mui/material/styles";

import { TimelineStyle } from "../settings/settingsSlice";

type WaveformProps = {
  peaks: Float32Array;
  // Current playback position and total length, in seconds.
  progress: number;
  duration: number;
  // Which waveform look to draw. Exclude<A, B> removes members from a union
  // type — "slider" means no waveform at all, so it can never reach here.
  variant: Exclude<TimelineStyle, "slider">;
  // Draw the faded mirrored copy under the baseline.
  reflection: boolean;
  disabled?: boolean;
  // Called with the final position when a click / drag ends.
  onSeek: (to: number) => void;
  // Called continuously while scrubbing (and with null when the scrub ends)
  // so the parent can preview the scrubbed time in the labels.
  onScrub: (to: number | null) => void;
};

const HEIGHT = 48;
const BAR_WIDTH = 2;
const BAR_GAP = 1;
// With the reflection on, fraction of the height used by the main wave; the
// rest holds the mirrored copy below the baseline.
const WAVE_PORTION = 0.7;

// The loudest peak within a fraction-range of the track.
function bucketMax(peaks: Float32Array, fromFraction: number, toFraction: number) {
  const start = Math.floor(fromFraction * peaks.length);
  const end = Math.max(start + 1, Math.ceil(toFraction * peaks.length));
  let max = 0;
  for (let i = start; i < end && i < peaks.length; i++) {
    if (peaks[i] > max) max = peaks[i];
  }
  return max;
}

// The track's amplitude envelope as a seekable canvas: played portion tinted
// with the theme color, with click/drag-to-seek matching the slider it
// replaces. Three looks: "bars" (columns with gaps), "smooth" (solid filled
// shape) and "line" (thin outline).
export function Waveform({
  peaks,
  progress,
  duration,
  variant,
  reflection,
  disabled,
  onSeek,
  onScrub,
}: WaveformProps) {
  const theme = useTheme();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [width, setWidth] = useState(0);
  // While scrubbing, the fraction (0–1) under the pointer. null = idle.
  const [scrubFraction, setScrubFraction] = useState<number | null>(null);

  // Watch the container's width so the canvas redraws on window resizes.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || width === 0) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Render at the display's real pixel density so the bars stay crisp.
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(HEIGHT * dpr);
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, HEIGHT);

    // Without the reflection the wave gets the full height.
    const baseline = reflection ? HEIGHT * WAVE_PORTION : HEIGHT - 1;
    const reflectionHeight = HEIGHT - baseline - 1;
    const playedFraction =
      scrubFraction ?? (duration > 0 ? progress / duration : 0);
    const playedX = playedFraction * width;

    // Draws the full-width wave in one color; called twice with different
    // clip regions for the played / unplayed split.
    function drawWave(color: string) {
      if (variant === "line") {
        // Thin outline tracing the envelope tops.
        const step = 2;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        for (let x = 0; x <= width; x += step) {
          const amplitude = bucketMax(peaks, x / width, (x + step) / width);
          const y = baseline - Math.max(1, amplitude * (baseline - 2));
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        if (reflection) {
          ctx.globalAlpha = 0.25;
          ctx.beginPath();
          for (let x = 0; x <= width; x += step) {
            const amplitude = bucketMax(peaks, x / width, (x + step) / width);
            const wave = Math.max(1, amplitude * (baseline - 2));
            const y = baseline + Math.min(wave * 0.45, reflectionHeight);
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();
          ctx.globalAlpha = 1;
        }
        return;
      }

      // "bars" = columns with gaps; "smooth" = 1px columns with no gap,
      // which reads as a solid filled shape.
      const barWidth = variant === "bars" ? BAR_WIDTH : 1;
      const gap = variant === "bars" ? BAR_GAP : 0;
      const barCount = Math.max(1, Math.floor(width / (barWidth + gap)));
      ctx.fillStyle = color;
      for (let i = 0; i < barCount; i++) {
        const amplitude = bucketMax(peaks, i / barCount, (i + 1) / barCount);
        const barHeight = Math.max(1, amplitude * (baseline - 2));
        const x = i * (barWidth + gap);
        ctx.fillRect(x, baseline - barHeight, barWidth, barHeight);
        if (reflection) {
          ctx.globalAlpha = 0.25;
          ctx.fillRect(
            x,
            baseline + 1,
            barWidth,
            Math.min(barHeight * 0.45, reflectionHeight)
          );
          ctx.globalAlpha = 1;
        }
      }
    }

    // Two passes with clipping: everything right of the playhead in grey,
    // then everything left of it in the theme color. Clipping (rather than
    // coloring whole bars) keeps the progress edge pixel-accurate.
    ctx.save();
    ctx.beginPath();
    ctx.rect(playedX, 0, width - playedX, HEIGHT);
    ctx.clip();
    drawWave("rgba(255, 255, 255, 0.35)");
    ctx.restore();

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, playedX, HEIGHT);
    ctx.clip();
    drawWave(theme.palette.primary.main);
    ctx.restore();
  }, [peaks, progress, duration, scrubFraction, width, theme, variant, reflection]);

  function fractionFromEvent(event: React.PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const fraction = (event.clientX - rect.left) / rect.width;
    return Math.min(1, Math.max(0, fraction));
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (disabled) return;
    // Keep receiving pointer events even if the drag leaves the element.
    event.currentTarget.setPointerCapture(event.pointerId);
    const fraction = fractionFromEvent(event);
    setScrubFraction(fraction);
    onScrub(Math.round(fraction * duration));
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (disabled || scrubFraction === null) return;
    const fraction = fractionFromEvent(event);
    setScrubFraction(fraction);
    onScrub(Math.round(fraction * duration));
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (disabled || scrubFraction === null) return;
    const fraction = fractionFromEvent(event);
    setScrubFraction(null);
    onScrub(null);
    onSeek(Math.round(fraction * duration));
  }

  function handlePointerCancel() {
    setScrubFraction(null);
    onScrub(null);
  }

  return (
    <Box
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      sx={{
        height: HEIGHT,
        width: "100%",
        cursor: disabled ? "default" : "pointer",
        // Make scrubbing own the pointer (no text-select / touch scrolling).
        touchAction: "none",
        userSelect: "none",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block" }}
      />
    </Box>
  );
}
