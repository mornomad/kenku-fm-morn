import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import Clear from "@mui/icons-material/CloseRounded";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";

import { RootState } from "../../app/store";
import { setKeybind } from "./settingsSlice";
import { GlobalKeybindAction } from "../../../types/keybinds";

const isMac = navigator.platform.toUpperCase().includes("MAC");

// Build an Electron accelerator string from a key event. Returns null while
// only modifiers are held (recording continues until a real key arrives).
// The platform's primary modifier (Cmd on mac, Ctrl on win) is stored as
// "CommandOrControl" so a binding recorded on one OS works on the other.
function acceleratorFromEvent(event: KeyboardEvent): string | null {
  const key = normalizeKey(event.key);
  if (!key) return null;
  const parts: string[] = [];
  if (isMac ? event.metaKey : event.ctrlKey) parts.push("CommandOrControl");
  if (isMac && event.ctrlKey) parts.push("Control");
  if (!isMac && event.metaKey) parts.push("Super");
  if (event.altKey) parts.push("Alt");
  if (event.shiftKey) parts.push("Shift");
  // Global shortcuts must carry a modifier (a bare global "Space" would
  // swallow the key system-wide) — except F-keys, which are fine alone.
  if (parts.length === 0 && !/^F\d+$/.test(key)) return null;
  parts.push(key);
  return parts.join("+");
}

// DOM key name → Electron accelerator key name.
function normalizeKey(key: string): string | null {
  switch (key) {
    case "Shift":
    case "Control":
    case "Alt":
    case "Meta":
      return null; // modifier-only — keep recording
    case " ":
      return "Space";
    case "ArrowUp":
      return "Up";
    case "ArrowDown":
      return "Down";
    case "ArrowLeft":
      return "Left";
    case "ArrowRight":
      return "Right";
    case "Enter":
      return "Return";
    default:
      return key.length === 1 ? key.toUpperCase() : key;
  }
}

// Pretty-print an accelerator for display ("CommandOrControl+Shift+M" →
// "⌘ Shift M" on mac, "Ctrl Shift M" on win).
export function formatAccelerator(accelerator: string): string {
  if (!accelerator) return "Not bound";
  return accelerator
    .split("+")
    .map((part) =>
      part === "CommandOrControl" ? (isMac ? "⌘" : "Ctrl") : part
    )
    .join(" ");
}

type KeybindFieldProps = {
  action: GlobalKeybindAction;
};

// Click → "Press keys…" → the next chord becomes the binding. Esc cancels,
// the ✕ unbinds. Recording uses a window-level capture listener so the chord
// never leaks into the rest of the app.
export function KeybindField({ action }: KeybindFieldProps) {
  const dispatch = useDispatch();
  const accelerator = useSelector(
    (state: RootState) => state.settings.keybinds[action]
  );
  const [recording, setRecording] = useState(false);

  function startRecording() {
    setRecording(true);
    function handleKeyDown(event: KeyboardEvent) {
      event.preventDefault();
      event.stopPropagation();
      if (event.key === "Escape") {
        stop();
        return;
      }
      const next = acceleratorFromEvent(event);
      if (next) {
        dispatch(setKeybind({ action, accelerator: next }));
        stop();
      }
    }
    function stop() {
      window.removeEventListener("keydown", handleKeyDown, true);
      setRecording(false);
    }
    // capture: true so we see the keys before any other handler.
    window.addEventListener("keydown", handleKeyDown, true);
  }

  return (
    <Stack direction="row" alignItems="center" gap={0.5}>
      <Button
        size="small"
        variant={recording ? "contained" : "outlined"}
        onClick={recording ? undefined : startRecording}
        sx={{ fontFamily: "monospace", textTransform: "none", minWidth: 160 }}
      >
        {recording ? "Press keys… (Esc cancels)" : formatAccelerator(accelerator)}
      </Button>
      <Tooltip title="Remove binding">
        <span>
          <IconButton
            size="small"
            disabled={!accelerator || recording}
            onClick={() => dispatch(setKeybind({ action, accelerator: "" }))}
          >
            <Clear fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );
}
