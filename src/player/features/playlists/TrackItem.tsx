import React, { useState } from "react";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import PlayArrow from "@mui/icons-material/PlayArrowRounded";
import Pause from "@mui/icons-material/PauseRounded";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";

import MoreVert from "@mui/icons-material/MoreVertRounded";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

import { useNavigate } from "react-router-dom";
import { v4 as uuid } from "uuid";

import {
  Track,
  removeTrack,
  moveTrackToPlaylist,
  copyTrackToPlaylist,
  Playlist,
  Tag,
} from "./playlistsSlice";
import { useDispatch, useSelector } from "react-redux";
import { TrackSettings } from "./TrackSettings";
import { TagChip } from "./TagChip";
import { TrackThumbnail } from "./TrackThumbnail";
import { playlistImageUrl } from "./playlistImage";
import { PlaylistPickerDialog } from "./PlaylistPickerDialog";
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
  // Multi-select (used on the playlist page). When selectionMode is on a
  // checkbox is shown; the others are unset elsewhere (e.g. search).
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelected?: (id: string) => void;
};

export function TrackItem({
  track,
  playlist,
  onPlay,
  selectionMode,
  selected,
  onToggleSelected,
}: TrackItemProps) {
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
  const navigate = useNavigate();

  // The playlist's image, used as the fallback cover for tracks without art.
  const playlistImage = playlistImageUrl(playlist);

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

  // null = closed; otherwise which action the playlist picker is for.
  const [picker, setPicker] = useState<null | "move" | "copy">(null);

  function handlePickPlaylist(toPlaylistId: string) {
    if (picker === "move") {
      dispatch(
        moveTrackToPlaylist({
          trackId: track.id,
          fromPlaylistId: playlist.id,
          toPlaylistId,
        }),
      );
    } else if (picker === "copy") {
      dispatch(
        copyTrackToPlaylist({
          trackId: track.id,
          toPlaylistId,
          newTrackId: uuid(),
        }),
      );
    }
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
          {selectionMode && (
            <Checkbox
              edge="start"
              checked={Boolean(selected)}
              onChange={() => onToggleSelected?.(track.id)}
              onClick={(event) => event.stopPropagation()}
              sx={{ mr: 0.5 }}
            />
          )}
          <TrackThumbnail
            track={track}
            size={40}
            playlistImage={playlistImage}
            sx={{ mr: 1.5 }}
          />
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
                    <TagChip
                      key={tag.id}
                      tag={tag}
                      sx={{ height: 18, fontSize: 11 }}
                      onClick={(event) => {
                        // Don't let the click also hit the surrounding row.
                        event.stopPropagation();
                        navigate(`/search?tag=${tag.id}`);
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
        <MenuItem
          onClick={() => {
            setPicker("move");
            handleMenuClose();
          }}
        >
          Move to playlist
        </MenuItem>
        <MenuItem
          onClick={() => {
            setPicker("copy");
            handleMenuClose();
          }}
        >
          Copy to playlist
        </MenuItem>
        <MenuItem onClick={handleCopyID}>Copy ID</MenuItem>
        <MenuItem onClick={handleDelete}>Delete</MenuItem>
      </Menu>
      <PlaylistPickerDialog
        open={picker !== null}
        title={picker === "copy" ? "Copy to playlist" : "Move to playlist"}
        excludePlaylistId={playlist.id}
        onPick={handlePickPlaylist}
        onClose={() => setPicker(null)}
      />
      <TrackSettings
        track={track}
        playlistImage={playlistImage}
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
    </ListItem>
  );
}
