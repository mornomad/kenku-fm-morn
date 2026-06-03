import React, { useState } from "react";
import Box from "@mui/material/Box";
import Popover from "@mui/material/Popover";

import { ColorPickerContent } from "./ColorPickerContent";

type TagColorPickerProps = {
  color: string;
  onChange: (color: string) => void;
  size?: number;
};

// A round color swatch that opens a popover with the preset palette, a Random
// button and a custom color input. Used in the Manage Tags screen.
export function TagColorPicker({ color, onChange, size = 24 }: TagColorPickerProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  return (
    <>
      <Box
        component="button"
        type="button"
        aria-label="Change tag color"
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{
          width: size,
          height: size,
          borderRadius: "50%",
          backgroundColor: color,
          border: "2px solid rgba(255,255,255,0.4)",
          cursor: "pointer",
          p: 0,
          flexShrink: 0,
        }}
      />
      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <ColorPickerContent value={color} onChange={onChange} />
      </Popover>
    </>
  );
}
