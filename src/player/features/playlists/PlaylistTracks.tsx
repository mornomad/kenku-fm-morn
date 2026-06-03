import React, { useRef, useState } from "react";

import Box from "@mui/material/Box";
import List from "@mui/material/List";

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

import { TrackItem } from "./TrackItem";
import { SortableItem } from "../../common/SortableItem";

import { useDispatch } from "react-redux";
import { Playlist, Track, moveTrack } from "./playlistsSlice";
import { moveQueueIfNeeded } from "./playlistPlaybackSlice";

import { useHideScrollbar } from "../../../renderer/common/useHideScrollbar";
import { useSelector } from "react-redux";
import { RootState } from "../../app/store";

type PlaylistTracksProps = {
  items: Track[];
  playlist: Playlist;
  onPlay: (id: string) => void;
  selectionMode?: boolean;
  selectedIds?: string[];
  onToggleSelected?: (id: string) => void;
};

export function PlaylistTracks({
  items,
  playlist,
  onPlay,
  selectionMode,
  selectedIds,
  onToggleSelected,
}: PlaylistTracksProps) {
  const dispatch = useDispatch();

  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 10 },
  });
  const keyboardSensor = useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  });

  const sensors = useSensors(pointerSensor, keyboardSensor);
  const uisettings = useSelector((state: RootState) => state.uisettings);

  const [dragId, setDragId] = useState<string | null>(null);
  function handleDragStart(event: DragStartEvent) {
    setDragId(event.active.id);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (active.id !== over.id) {
      dispatch(
        moveTrack({
          playlistId: playlist.id,
          active: active.id,
          over: over.id,
        }),
      );
      dispatch(
        moveQueueIfNeeded({
          playlistId: playlist.id,
          active: active.id,
          over: over.id,
        }),
      );
    }

    setDragId(null);
  }

  const scrollRef = useRef<HTMLDivElement>(null);
  const hideScrollbar = useHideScrollbar(scrollRef);

  return (
    <Box
      sx={{
        overflowY: "auto",
        maskImage:
          "linear-gradient(to bottom, transparent, black 60px, black calc(100% - 64px), transparent)",
        position: "absolute",
        width: "100%",
        height: "calc(100% - 120px)",
        pt: "60px",
        top: "120px",
        left: 0,
        px: 2,
      }}
      ref={scrollRef}
      {...hideScrollbar}
    >
      <List
        sx={{
          width: "100%",
          minWidth: 360,
          maxWidth: uisettings.byName["containerwidth"].value == "full" ? "100%" : 720,
          margin: "0 auto",
          marginBottom: "240px",
        }}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={items} strategy={verticalListSortingStrategy}>
            {items.map((item) => (
              <SortableItem key={item.id} id={item.id}>
                <TrackItem
                  track={item}
                  playlist={playlist}
                  onPlay={onPlay}
                  selectionMode={selectionMode}
                  selected={selectedIds?.includes(item.id)}
                  onToggleSelected={onToggleSelected}
                />
              </SortableItem>
            ))}
            <DragOverlay>
              {dragId ? (
                <TrackItem
                  track={items.find((track) => track.id === dragId)}
                  playlist={playlist}
                  onPlay={onPlay}
                />
              ) : null}
            </DragOverlay>
          </SortableContext>
        </DndContext>
      </List>
    </Box>
  );
}
