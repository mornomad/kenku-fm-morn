import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import Back from "@mui/icons-material/ChevronLeftRounded";
import ClearAll from "@mui/icons-material/ClearAllRounded";
import HomeIcon from "@mui/icons-material/HomeRounded";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import { RootState } from "../../app/store";
import { SortableItem } from "../../common/SortableItem";
import {
  clearQueue,
  moveQueueItem,
  Playlist,
  QUEUE_PLAYLIST_ID,
  Track,
} from "../playlists/playlistsSlice";
import {
  moveQueueIfNeeded,
  startQueue,
} from "../playlists/playlistPlaybackSlice";
import { TrackItem } from "../playlists/TrackItem";

type QueueProps = {
  // Plays a track. Wired to the shared playlist playback in App.
  onPlay: (track: Track) => void;
};

export function Queue({ onPlay }: QueueProps) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const playlists = useSelector((state: RootState) => state.playlists);
  const queueIds = playlists.queue;

  // Map every track id to the playlist that contains it (for the caption and
  // the TrackItem menu actions, which are playlist-aware).
  const playlistByTrackId = useMemo(() => {
    const map: Record<string, Playlist> = {};
    for (const playlistId of playlists.playlists.allIds) {
      const playlist = playlists.playlists.byId[playlistId];
      for (const trackId of playlist.tracks) {
        map[trackId] = playlist;
      }
    }
    return map;
  }, [playlists.playlists]);

  // Resolve ids to tracks, dropping anything stale (defensive — the delete
  // reducers strip queued ids, so these should always resolve).
  const tracks = queueIds
    .map((id) => playlists.tracks[id])
    .filter((track): track is Track => Boolean(track));

  function handlePlay(trackId: string) {
    const track = playlists.tracks[trackId];
    if (track) {
      // The queue itself becomes the active playback list, under the sentinel
      // id — next/previous/repeat now loop the queue.
      dispatch(
        startQueue({
          tracks: [...queueIds],
          trackId,
          playlistId: QUEUE_PLAYLIST_ID,
        }),
      );
      onPlay(track);
    }
  }

  function handleClear() {
    if (window.confirm("Clear the queue?")) {
      dispatch(clearQueue());
    }
  }

  // Drag-reorder, mirroring PlaylistTracks.
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 10 },
  });
  const keyboardSensor = useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  });
  const sensors = useSensors(pointerSensor, keyboardSensor);

  const [dragId, setDragId] = useState<string | null>(null);
  function handleDragStart(event: DragStartEvent) {
    setDragId(event.active.id);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (active.id !== over.id) {
      dispatch(moveQueueItem({ active: active.id, over: over.id }));
      // Keep the live playback copy in step when the queue is what's playing.
      dispatch(
        moveQueueIfNeeded({
          playlistId: QUEUE_PLAYLIST_ID,
          active: active.id,
          over: over.id,
        }),
      );
    }
    setDragId(null);
  }

  const dragTrack = dragId ? playlists.tracks[dragId] : undefined;

  return (
    <Container
      sx={{ height: "100vh", display: "flex", flexDirection: "column" }}
    >
      <Stack
        p={2}
        direction="row"
        alignItems="center"
        gap={2}
        sx={{ zIndex: 1 }}
      >
        <IconButton onClick={() => navigate(-1)}>
          <Back />
        </IconButton>
        <Typography variant="h4" noWrap sx={{ flexGrow: 1 }}>
          Queue
        </Typography>
        <Tooltip title="Home">
          <IconButton onClick={() => navigate("/")}>
            <HomeIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Clear queue">
          <span>
            <IconButton onClick={handleClear} disabled={tracks.length === 0}>
              <ClearAll />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
      <Stack px={2}>
        <Typography variant="caption" color="text.secondary">
          {tracks.length} {tracks.length === 1 ? "track" : "tracks"} — drag to
          reorder
        </Typography>
        {tracks.length === 0 && (
          <Typography color="text.secondary" mt={2}>
            The queue is empty. Add tracks from any playlist or search result
            with the ⋮ menu → &quot;Add to queue&quot;.
          </Typography>
        )}
      </Stack>
      <Box sx={{ flex: 1, overflowY: "auto", px: 1, pb: "248px" }}>
        <List>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={tracks}
              strategy={verticalListSortingStrategy}
            >
              {tracks.map((track) => {
                const playlist = playlistByTrackId[track.id];
                if (!playlist) return null;
                return (
                  <SortableItem key={track.id} id={track.id}>
                    <Typography
                      variant="caption"
                      sx={{ pl: 2, opacity: 0.7 }}
                      noWrap
                    >
                      {playlist.title}
                    </Typography>
                    <TrackItem
                      track={track}
                      playlist={playlist}
                      onPlay={handlePlay}
                    />
                  </SortableItem>
                );
              })}
              <DragOverlay>
                {dragTrack && playlistByTrackId[dragTrack.id] ? (
                  <TrackItem
                    track={dragTrack}
                    playlist={playlistByTrackId[dragTrack.id]}
                    onPlay={handlePlay}
                  />
                ) : null}
              </DragOverlay>
            </SortableContext>
          </DndContext>
        </List>
      </Box>
    </Container>
  );
}
