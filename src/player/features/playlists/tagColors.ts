// A fixed palette of tag colors. New tags get a color from here so chips are
// visually distinct without asking the user to pick one up front. The color is
// stored on the Tag entity, so it can be changed later from a manage-tags UI.
export const tagColors = [
  "#e57373", // red
  "#f06292", // pink
  "#ba68c8", // purple
  "#7986cb", // indigo
  "#64b5f6", // blue
  "#4dd0e1", // cyan
  "#4db6ac", // teal
  "#81c784", // green
  "#dce775", // lime
  "#ffd54f", // amber
  "#ffb74d", // orange
  "#a1887f", // brown
];

// Pick a color for a new tag. We offset by how many tags already exist so the
// first handful of tags each get a different color rather than all the same.
export function nextTagColor(existingTagCount: number): string {
  return tagColors[existingTagCount % tagColors.length];
}
