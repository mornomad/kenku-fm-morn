import React, { useEffect, useState } from "react";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import PlayArrow from "@mui/icons-material/PlayArrowRounded";
import Pause from "@mui/icons-material/PauseRounded";
import RadioButtonUnchecked from "@mui/icons-material/RadioButtonUncheckedRounded";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import Tooltip from "@mui/material/Tooltip";

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
  addToQueue,
  removeFromQueue,
  QUEUE_PLAYLIST_ID,
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
  appendTracksToQueueIfNeeded,
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

  // This track's 1-based position in the play queue, or null if not queued.
  // (A primitive return keeps the selector referentially stable.)
  const queuePosition = useSelector((state: RootState) => {
    const index = state.playlists.queue.indexOf(track.id);
    return index === -1 ? null : index + 1;
  });
  const inQueue = queuePosition !== null;

  function toggleQueue() {
    if (inQueue) {
      dispatch(removeFromQueue(track.id));
      // Keep the live playback list in step if the queue is what's playing.
      dispatch(
        removeTrackFromQueue({
          playlistId: QUEUE_PLAYLIST_ID,
          trackId: track.id,
        }),
      );
    } else {
      dispatch(addToQueue({ trackIds: [track.id] }));
      dispatch(
        appendTracksToQueueIfNeeded({
          playlistId: QUEUE_PLAYLIST_ID,
          trackIds: [track.id],
        }),
      );
    }
  }

  function handleQueueToggle() {
    toggleQueue();
    handleMenuClose();
  }

  // Keyboard quick-queue: press Q while the pointer is over this row. The
  // listener only exists while hovered, so there's one at most app-wide.
  const [hovered, setHovered] = useState(false);
  useEffect(() => {
    if (!hovered) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "q" && event.key !== "Q") return;
      // Don't hijack the letter q while typing in a text field.
      const target = event.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }
      toggleQueue();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // toggleQueue is recreated each render; re-running on these deps keeps the
    // closure fresh without re-attaching on unrelated renders.
  }, [hovered, inQueue, track.id]);

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
    // Also drop it from the live list when the play queue is what's playing
    // (removeTrack already strips it from the persistent queue itself).
    dispatch(
      removeTrackFromQueue({ trackId: track.id, playlistId: QUEUE_PLAYLIST_ID }),
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
          sx={{
            m: 0,
            borderRadius: "16px",
            // Reveal the queue toggle when the row is hovered (queued tracks
            // keep it visible via the button's own opacity).
            "&:hover .queue-toggle": { opacity: 1 },
          }}
          dense
          selected={isCurrentTrack}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
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
          <Tooltip
            title={
              inQueue
                ? `In queue — #${queuePosition} (click or Q to remove)`
                : "Add to queue (Q)"
            }
          >
            <IconButton
              aria-label={inQueue ? "remove from queue" : "add to queue"}
              className="queue-toggle"
              onClick={(event) => {
                // Keep the click from also triggering the row.
                event.stopPropagation();
                toggleQueue();
              }}
              sx={{
                opacity: inQueue ? 1 : 0,
                transition: "opacity 0.2s",
                "&:focus-visible": { opacity: 1 },
              }}
            >
              {inQueue ? (
                // Queued: a filled circle with the queue position inside.
                <Box
                  sx={{
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {queuePosition}
                </Box>
              ) : (
                // Not queued: an empty ring, muted so it doesn't compete with
                // the play button (brightens on direct hover).
                <RadioButtonUnchecked
                  sx={{
                    color: "rgba(255, 255, 255, 0.35)",
                    ".queue-toggle:hover &": {
                      color: "rgba(255, 255, 255, 0.7)",
                    },
                  }}
                />
              )}
            </IconButton>
          </Tooltip>
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
        <MenuItem onClick={handleQueueToggle}>
          {inQueue ? "Remove from queue" : "Add to queue"}
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
