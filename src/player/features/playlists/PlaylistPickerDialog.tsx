import React from "react";
import { useSelector } from "react-redux";

import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";

import { RootState } from "../../app/store";

type PlaylistPickerDialogProps = {
  open: boolean;
  title: string;
  // Hide this playlist from the list (e.g. the one the track is already in).
  excludePlaylistId?: string;
  onPick: (playlistId: string) => void;
  onClose: () => void;
};

// A simple dialog that lists playlists to pick one — used for "Move to…" and
// "Copy to…" on a track.
export function PlaylistPickerDialog({
  open,
  title,
  excludePlaylistId,
  onPick,
  onClose,
}: PlaylistPickerDialogProps) {
  const playlists = useSelector((state: RootState) => state.playlists.playlists);
  const options = playlists.allIds
    .map((id) => playlists.byId[id])
    .filter((playlist) => playlist.id !== excludePlaylistId);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      {options.length === 0 ? (
        <Typography sx={{ px: 3, pb: 3 }} color="text.secondary">
          No other playlists to choose from.
        </Typography>
      ) : (
        <List sx={{ pb: 1 }}>
          {options.map((playlist) => (
            <ListItemButton
              key={playlist.id}
              onClick={() => {
                onPick(playlist.id);
                onClose();
              }}
            >
              <ListItemText primary={playlist.title} />
            </ListItemButton>
          ))}
        </List>
      )}
    </Dialog>
  );
}
