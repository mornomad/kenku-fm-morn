import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Shuffle from "@mui/icons-material/ShuffleRounded";

import { tagColors, randomTagColor } from "./tagColors";

type ColorPickerContentProps = {
  value?: string;
  onChange: (color: string) => void;
  // Show the native "custom color" input. On by default.
  showCustom?: boolean;
};

// The inner contents of a tag color picker: the preset palette, a Random
// button (generates a readable random color), and an optional custom picker.
// Shared by the Manage Tags swatch popover and the right-click chip menu.
export function ColorPickerContent({
  value,
  onChange,
  showCustom = true,
}: ColorPickerContentProps) {
  return (
    <Box sx={{ p: 1.5, width: 216 }}>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {tagColors.map((swatch) => (
          <Box
            key={swatch}
            component="button"
            type="button"
            aria-label={`Set color ${swatch}`}
            onClick={() => onChange(swatch)}
            sx={{
              width: 24,
              height: 24,
              borderRadius: "6px",
              backgroundColor: swatch,
              border:
                swatch === value ? "2px solid #fff" : "2px solid transparent",
              cursor: "pointer",
              p: 0,
            }}
          />
        ))}
      </Box>
      <Stack
        direction="row"
        gap={1}
        mt={1.5}
        alignItems="center"
        justifyContent="space-between"
      >
        <Button
          size="small"
          startIcon={<Shuffle />}
          onClick={() => onChange(randomTagColor())}
        >
          Random
        </Button>
        {showCustom && (
          <Stack direction="row" gap={0.5} alignItems="center">
            <Typography variant="caption">Custom</Typography>
            <input
              type="color"
              value={value ?? "#000000"}
              onChange={(event) => onChange(event.target.value)}
            />
          </Stack>
        )}
      </Stack>
    </Box>
  );
}
