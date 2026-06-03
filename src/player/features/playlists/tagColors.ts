// A fixed palette of tag colors. New tags get a color from here so chips are
// visually distinct without asking the user to pick one up front. The color is
// stored on the Tag entity, so it can be changed later from a manage-tags UI.
// All are mid-tone so they stay readable with the auto-contrast label color.
export const tagColors = [
  "#e57373", // red
  "#ef5350", // bright red
  "#f06292", // pink
  "#ec407a", // magenta
  "#ba68c8", // purple
  "#ab47bc", // deep purple
  "#9575cd", // lavender
  "#7986cb", // indigo
  "#5c6bc0", // indigo deep
  "#64b5f6", // blue
  "#42a5f5", // blue bright
  "#4fc3f7", // light blue
  "#4dd0e1", // cyan
  "#26c6da", // cyan deep
  "#4db6ac", // teal
  "#26a69a", // teal deep
  "#81c784", // green
  "#66bb6a", // green deep
  "#9ccc65", // light green
  "#dce775", // lime
  "#d4e157", // lime deep
  "#ffd54f", // amber
  "#ffca28", // amber deep
  "#ffb74d", // orange
  "#ff7043", // deep orange
  "#a1887f", // brown
  "#8d6e63", // brown deep
  "#90a4ae", // blue grey
  "#78909c", // slate
];

// Pick a color for a new tag. We offset by how many tags already exist so the
// first handful of tags each get a different color rather than all the same.
export function nextTagColor(existingTagCount: number): string {
  return tagColors[existingTagCount % tagColors.length];
}

// Convert HSL (h 0–360, s/l 0–100) to a #rrggbb hex string.
function hslToHex(h: number, s: number, l: number): string {
  const sat = s / 100;
  const lum = l / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = sat * Math.min(lum, 1 - lum);
  const channel = (n: number) => {
    const value = lum - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
    return Math.round(255 * value)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}

// Generate a random but readable tag color: any hue, but saturation and
// lightness kept in a mid range so the chip is vivid and the auto-contrast
// label color stays legible (avoids near-black, near-white, and muddy tones).
export function randomTagColor(): string {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 60 + Math.floor(Math.random() * 15); // 60–74%
  const lightness = 55 + Math.floor(Math.random() * 12); // 55–66%
  return hslToHex(hue, saturation, lightness);
}

// Choose readable text (dark or white) for a given background color, based on
// its perceived brightness. Keeps a pale-yellow chip and a dark-blue chip both
// legible. Falls back to dark text if the color can't be parsed.
export function tagTextColor(backgroundColor: string): string {
  const hex = backgroundColor.replace("#", "");
  if (hex.length < 6) {
    return "rgba(0,0,0,0.87)";
  }
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) {
    return "rgba(0,0,0,0.87)";
  }
  // YIQ perceived brightness (0–255). Above ~140 reads better with dark text.
  const brightness = (r * 299 + g * 587 + b * 114) / 1000;
  return brightness >= 140 ? "rgba(0,0,0,0.87)" : "#ffffff";
}
