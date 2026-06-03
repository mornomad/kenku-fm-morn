import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";

import Back from "@mui/icons-material/ChevronLeftRounded";
import HomeIcon from "@mui/icons-material/HomeRounded";
import LocalOffer from "@mui/icons-material/LocalOfferRounded";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import { RootState } from "../../app/store";
import { Playlist, Track } from "../playlists/playlistsSlice";
import { startQueue } from "../playlists/playlistPlaybackSlice";
import { TagChip } from "../playlists/TagChip";
import { TrackItem } from "../playlists/TrackItem";
import { UnifiedTagSearch } from "./UnifiedTagSearch";

type SearchProps = {
  // Plays a track. Wired to the shared playlist playback in App.
  onPlay: (track: Track) => void;
};

export function Search({ onPlay }: SearchProps) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const playlists = useSelector((state: RootState) => state.playlists);
  const searchMode = useSelector(
    (state: RootState) => state.settings.searchMode,
  );

  // The filter lives in the URL (?tag=<id>&tag=<id>&match=all|any) so a tag
  // click anywhere can deep-link here, and the back button restores filters.
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedTagIds = searchParams.getAll("tag");
  const matchMode = searchParams.get("match") === "any" ? "any" : "all";
  // join() gives a stable string for the useMemo deps below (the array from
  // getAll is a fresh reference every render).
  const selectedKey = selectedTagIds.join(",");

  // Title text filter is plain local state — no need to put it in the URL.
  const [query, setQuery] = useState("");

  const allTags = playlists.tags.allIds.map((id) => playlists.tags.byId[id]);
  const selectedTags = selectedTagIds
    .map((id) => playlists.tags.byId[id])
    .filter((tag) => Boolean(tag));

  // How many tracks use each tag, for the "Combat (12)" counts.
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const track of Object.values(playlists.tracks)) {
      for (const id of track.tagIds) {
        counts[id] = (counts[id] ?? 0) + 1;
      }
    }
    return counts;
  }, [playlists.tracks]);

  // Map every track id to the playlist that contains it.
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

  const results = useMemo(() => {
    const text = query.trim().toLowerCase();
    const ids = selectedKey === "" ? [] : selectedKey.split(",");
    return Object.values(playlists.tracks)
      .filter((track) => {
        const matchesTags =
          ids.length === 0
            ? true
            : matchMode === "all"
              ? ids.every((id) => track.tagIds.includes(id))
              : ids.some((id) => track.tagIds.includes(id));
        const matchesText =
          text === "" || track.title.toLowerCase().includes(text);
        return matchesTags && matchesText;
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [playlists.tracks, selectedKey, matchMode, query]);

  // Write a new set of selected tag ids back into the URL. `replace: true` so
  // each filter tweak updates the current history entry instead of stacking a
  // new one — otherwise the back button would step through every filter change.
  function setSelected(tagIds: string[]) {
    const next = new URLSearchParams(searchParams);
    next.delete("tag");
    tagIds.forEach((id) => next.append("tag", id));
    setSearchParams(next, { replace: true });
  }

  function setMatch(mode: "all" | "any") {
    const next = new URLSearchParams(searchParams);
    next.set("match", mode);
    setSearchParams(next, { replace: true });
  }

  function handlePlay(trackId: string) {
    const track = playlists.tracks[trackId];
    const playlist = playlistByTrackId[trackId];
    if (track && playlist) {
      dispatch(
        startQueue({
          tracks: [...playlist.tracks],
          trackId,
          playlistId: playlist.id,
        }),
      );
      onPlay(track);
    }
  }

  return (
    <Container sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
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
          Search
        </Typography>
        <Tooltip title="Home">
          <IconButton onClick={() => navigate("/")}>
            <HomeIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Manage tags">
          <IconButton onClick={() => navigate("/tags")}>
            <LocalOffer />
          </IconButton>
        </Tooltip>
      </Stack>
      <Stack px={2} gap={2}>
        {searchMode === "unified" ? (
          <UnifiedTagSearch
            allTags={allTags}
            selectedTags={selectedTags}
            onSelectedChange={setSelected}
            nameQuery={query}
            onNameQueryChange={setQuery}
            tagCounts={tagCounts}
          />
        ) : (
          <>
            <Autocomplete
              multiple
              options={allTags}
              value={selectedTags}
              onChange={(_event, value) =>
                setSelected(value.map((tag) => tag.id))
              }
              getOptionLabel={(option) => option.name}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              filterSelectedOptions
              renderTags={(value, getTagProps) =>
                value.map((tag, index) => {
                  const { key } = getTagProps({ index });
                  return (
                    <TagChip
                      key={key}
                      tag={tag}
                      onDelete={() =>
                        setSelected(
                          selectedTagIds.filter((id) => id !== tag.id),
                        )
                      }
                    />
                  );
                })
              }
              renderOption={(props, option) => {
                const { key, ...optionProps } = props;
                return (
                  <Box
                    component="li"
                    key={key}
                    {...optionProps}
                    sx={{ display: "flex", gap: 1 }}
                  >
                    <TagChip tag={option} />
                    <Typography variant="caption" color="text.secondary">
                      {tagCounts[option.id] ?? 0}
                    </Typography>
                  </Box>
                );
              }}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="standard"
                  // Focus as soon as the search screen opens (single click from
                  // the home search button).
                  autoFocus
                  label="Filter by tags"
                  // Only show the placeholder when nothing is picked yet, so it
                  // doesn't sit distractingly next to existing tag chips.
                  placeholder={
                    selectedTags.length === 0 ? "Pick tags" : undefined
                  }
                />
              )}
            />
            <TextField
              variant="standard"
              label="Filter by title"
              placeholder="Type part of a track name"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              fullWidth
            />
          </>
        )}
        {selectedTags.length > 1 && (
          <Box>
            <ToggleButtonGroup
              size="small"
              exclusive
              value={matchMode}
              onChange={(_event, value) => value && setMatch(value)}
            >
              <ToggleButton value="all">Match all</ToggleButton>
              <ToggleButton value="any">Match any</ToggleButton>
            </ToggleButtonGroup>
          </Box>
        )}
        <Typography variant="caption" color="text.secondary">
          {results.length} {results.length === 1 ? "track" : "tracks"}
        </Typography>
      </Stack>
      <Box sx={{ flex: 1, overflowY: "auto", px: 1, pb: "248px" }}>
        <List>
          {results.map((track) => {
            const playlist = playlistByTrackId[track.id];
            if (!playlist) return null;
            return (
              <Box key={track.id}>
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
              </Box>
            );
          })}
        </List>
      </Box>
    </Container>
  );
}
