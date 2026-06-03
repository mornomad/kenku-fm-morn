import React, { useState } from "react";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import PlayArrow from "@mui/icons-material/PlayArrowRounded";
import Pause from "@mui/icons-material/PauseRounded";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";

import MoreVert from "@mui/icons-material/MoreVertRounded";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

import { Track, removeTrack, Playlist, Tag } from "./playlistsSlice";
import { useDispatch, useSelector } from "react-redux";
import { TrackSettings } from "./TrackSettings";
import { RootState } from "../../app/store";
import {
  playPause,
  removeTrackFromQueue,
  startQueue,
  stopTrack,
  updatePlayback,
} from "./playlistPlaybackSlice";

type TrackItemProps = {
  track: Track;
  playlist: Playlist;
  onPlay: (id: string) => void;
};

export function TrackItem({ track, playlist, onPlay }: TrackItemProps) {
  const isCurrentTrack = useSelector(
    (state: RootState) => state.playlistPlayback.track?.id === track.id,
  );
  const playing = useSelector(
    (state: RootState) => state.playlistPlayback.playing && isCurrentTrack,
  );
  // Resolve this track's tag ids into the actual Tag objects so we can show
  // their names and colors. Filter drops any id whose tag no longer exists.
  const tags = useSelector((state: RootState) =>
    track.tagIds
      .map((id) => state.playlists.tags.byId[id])
      .filter((tag): tag is Tag => Boolean(tag)),
  );
  const dispatch = useDispatch();

  const [settingsOpen, setSettingsOpen] = useState(false);

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);
  function handleMenuClick(event: React.MouseEvent<HTMLButtonElement>) {
    setAnchorEl(event.currentTarget);
  }
  function handleMenuClose() {
    setAnchorEl(null);
  }

  function handleEdit() {
    setSettingsOpen(true);
    handleMenuClose();
  }

  function handleCopyID() {
    navigator.clipboard.writeText(track.id);
    handleMenuClose();
  }

  function handleDelete() {
    // TODO: Fix bug where playback does not update to zero when isCurrentTrack is removed
    if (isCurrentTrack) {
      dispatch(playPause(false));
      dispatch(stopTrack());
    }
    dispatch(removeTrack({ trackId: track.id, playlistId: playlist.id }));
    dispatch(
      removeTrackFromQueue({ trackId: track.id, playlistId: playlist.id }),
    );
    handleMenuClose();
  }

  function handlePlayPause() {
    if (isCurrentTrack) {
      dispatch(playPause(!playing));
    } else {
      onPlay(track.id);
    }
  }

  return (
    <ListItem key={track.id} disablePadding>
      <Paper
        sx={{
          minWidth: 0,
          width: "100%",
          m: 0.5,
          backgroundColor: "rgba(34, 38, 57, 0.8)",
        }}
      >
        <ListItemButton
          role={undefined}
          sx={{ m: 0, borderRadius: "16px" }}
          dense
          selected={isCurrentTrack}
        >
          <ListItemText
            primary={track.title}
            secondary={
              tags.length > 0 ? (
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 0.5,
                    mt: 0.5,
                  }}
                >
                  {tags.map((tag) => (
                    <Chip
                      key={tag.id}
                      label={tag.name}
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: 11,
                        backgroundColor: tag.color,
                        color: "rgba(0,0,0,0.87)",
                      }}
                    />
                  ))}
                </Box>
              ) : undefined
            }
            sx={{
              ".MuiListItemText-primary": {
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              },
            }}
            primaryTypographyProps={{
              typography: "body1",
            }}
            // Render the secondary slot as a div so the chip Box (a div) isn't
            // nested inside a <p>, which would be invalid HTML.
            secondaryTypographyProps={{ component: "div" }}
          />
          <IconButton
            aria-label={playing ? "pause" : "play"}
            onClick={handlePlayPause}
          >
            {playing ? <Pause /> : <PlayArrow />}
          </IconButton>
          <IconButton onClick={handleMenuClick}>
            <MoreVert />
          </IconButton>
        </ListItemButton>
      </Paper>
      <Menu
        id="playlist-menu"
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleMenuClose}
        slotProps={{ list: { "aria-labelledby": "more-button" } }}
      >
        <MenuItem onClick={handleEdit}>Edit</MenuItem>
        <MenuItem onClick={handleCopyID}>Copy ID</MenuItem>
        <MenuItem onClick={handleDelete}>Delete</MenuItem>
      </Menu>
      <TrackSettings
        track={track}
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </ListItem>
  );
}
