import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import Back from "@mui/icons-material/ChevronLeftRounded";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { RootState } from "../../app/store";
import { Playlist, Tag, Track } from "../playlists/playlistsSlice";
import { startQueue } from "../playlists/playlistPlaybackSlice";
import { TrackItem } from "../playlists/TrackItem";

type SearchProps = {
  // Plays a track. Wired to the shared playlist playback in App.
  onPlay: (track: Track) => void;
};

export function Search({ onPlay }: SearchProps) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const playlists = useSelector((state: RootState) => state.playlists);

  // Which tags and title text the user is filtering by.
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [query, setQuery] = useState("");

  const allTags = playlists.tags.allIds.map((id) => playlists.tags.byId[id]);

  // Map every track id to the playlist that contains it, so each result can
  // show its playlist and we can set up the right queue when it plays. Built
  // once per change to the playlists slice rather than on every render.
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

  // A track matches when it carries every selected tag (AND, to narrow down)
  // and its title contains the typed text. Sorted by title for stable output.
  const results = useMemo(() => {
    const text = query.trim().toLowerCase();
    return Object.values(playlists.tracks)
      .filter((track) => {
        const matchesTags = selectedTags.every((tag) =>
          track.tagIds.includes(tag.id),
        );
        const matchesText =
          text === "" || track.title.toLowerCase().includes(text);
        return matchesTags && matchesText;
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [playlists.tracks, selectedTags, query]);

  // Play a search result: rebuild that track's playlist queue, then play it.
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
        <Typography variant="h4" noWrap>
          Search
        </Typography>
      </Stack>
      <Stack px={2} gap={2}>
        <Autocomplete
          multiple
          options={allTags}
          value={selectedTags}
          onChange={(_event, value) => setSelectedTags(value)}
          getOptionLabel={(option) => option.name}
          isOptionEqualToValue={(option, value) => option.id === value.id}
          filterSelectedOptions
          renderTags={(value, getTagProps) =>
            value.map((tag, index) => {
              const { key, ...tagProps } = getTagProps({ index });
              return (
                <Chip
                  key={key}
                  label={tag.name}
                  {...tagProps}
                  sx={{
                    backgroundColor: tag.color,
                    color: "rgba(0,0,0,0.87)",
                  }}
                />
              );
            })
          }
          renderInput={(params) => (
            <TextField
              {...params}
              variant="standard"
              label="Filter by tags"
              placeholder="Pick tags"
            />
          )}
        />
        <TextField
          variant="standard"
          label="Filter by title"
          placeholder="Type part of a track name"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
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
