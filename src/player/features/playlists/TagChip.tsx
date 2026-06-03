import React, { useState } from "react";
import Chip from "@mui/material/Chip";
import Popover from "@mui/material/Popover";
import { SxProps, Theme } from "@mui/material/styles";
import { useDispatch } from "react-redux";

import { editTag, Tag } from "./playlistsSlice";
import { tagTextColor } from "./tagColors";
import { ColorPickerContent } from "./ColorPickerContent";

type TagChipProps = {
  tag: Tag;
  size?: "small" | "medium";
  // When provided the chip looks/acts clickable (used for click-to-search).
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  // When provided the chip shows an ✕ to remove it.
  onDelete?: () => void;
  // Right-click opens a quick recolor menu unless this is set.
  disableRecolor?: boolean;
  sx?: SxProps<Theme>;
};

// A single tag rendered as a colored chip with auto-contrasting text. Shared by
// the track rows, the player bar and search so they all look and behave the
// same. Right-clicking opens a quick color picker that recolors the tag
// everywhere at once (via the editTag reducer).
export function TagChip({
  tag,
  size = "small",
  onClick,
  onDelete,
  disableRecolor,
  sx,
}: TagChipProps) {
  const dispatch = useDispatch();
  const textColor = tagTextColor(tag.color);
  // Anchor position for the right-click recolor menu (null = closed).
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(
    null,
  );

  function handleContextMenu(event: React.MouseEvent<HTMLDivElement>) {
    if (disableRecolor) return;
    event.preventDefault();
    event.stopPropagation();
    setMenuPos({ top: event.clientY, left: event.clientX });
  }

  return (
    <>
      <Chip
        label={tag.name}
        size={size}
        onClick={onClick}
        onDelete={onDelete}
        onContextMenu={handleContextMenu}
        sx={{
          backgroundColor: tag.color,
          color: textColor,
          // Match the delete ✕ to the label color (and keep it visible on hover).
          "& .MuiChip-deleteIcon": {
            color: textColor,
            opacity: 0.7,
            "&:hover": { color: textColor, opacity: 1 },
          },
          ...sx,
        }}
      />
      <Popover
        open={menuPos !== null}
        onClose={() => setMenuPos(null)}
        anchorReference="anchorPosition"
        anchorPosition={menuPos ?? undefined}
      >
        <ColorPickerContent
          value={tag.color}
          onChange={(color) => dispatch(editTag({ id: tag.id, color }))}
        />
      </Popover>
    </>
  );
}
