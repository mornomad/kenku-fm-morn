import React, { useState } from "react";

import styled from "@mui/material/styles/styled";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Slider from "@mui/material/Slider";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Pause from "@mui/icons-material/PauseRounded";
import PlayArrow from "@mui/icons-material/PlayArrowRounded";
import VolumeDown from "@mui/icons-material/VolumeDownRounded";
import VolumeOff from "@mui/icons-material/VolumeOffRounded";
import VolumeUp from "@mui/icons-material/VolumeUp";
import RepeatIcon from "@mui/icons-material/RepeatRounded";
import RepeatOne from "@mui/icons-material/RepeatOneRounded";
import Shuffle from "@mui/icons-material/ShuffleRounded";
import Next from "@mui/icons-material/SkipNextRounded";
import Previous from "@mui/icons-material/SkipPreviousRounded";
import useMediaQuery from "@mui/material/useMediaQuery";

import { useLocation, useNavigate } from "react-router-dom";

import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../app/store";
import { Tag } from "../playlists/playlistsSlice";
import { TagChip } from "../playlists/TagChip";
import { TrackThumbnail } from "../playlists/TrackThumbnail";
import { playlistImageUrl } from "../playlists/playlistImage";
import {
  adjustVolume,
  playPause,
  mute,
  shuffle,
  repeat,
} from "../playlists/playlistPlaybackSlice";

const minWidthForLargeContext = 650;

const TimeSlider = styled(Slider)({
  color: "#fff",
  height: 4,
  "& .MuiSlider-thumb": {
    width: 8,
    height: 8,
    "&:before": {
      boxShadow: "0 2px 12px 0 rgba(0,0,0,0.4)",
    },
    "&:hover, &.Mui-focusVisible": {
      boxShadow: "0px 0px 0px 8px rgb(255 255 255 / 16%)",
    },
    "&.Mui-active": {
      width: 20,
      height: 20,
    },
  },
  "& .MuiSlider-rail": {
    opacity: 0.28,
  },
});

const VolumeSlider = styled(Slider)({
  color: "#fff",
  "& .MuiSlider-track": {
    border: "none",
  },
  "& .MuiSlider-thumb": {
    width: 24,
    height: 24,
    backgroundColor: "#fff",
    "&:hover, &.Mui-focusVisible, &.Mui-active": {
      boxShadow: "0 4px 8px rgba(0,0,0,0.4)",
    },
  },
});

const TinyText = styled(Typography)({
  fontSize: "0.75rem",
  opacity: 0.38,
  fontWeight: 500,
  letterSpacing: 0.2,
});

type PlaylistPlayerProps = {
  onPlaylistNext: () => void;
  onPlaylistPrevious: () => void;
  onPlaylistSeek: (to: number) => void;
};

function Title() {
  const navigate = useNavigate();
  const location = useLocation();
  const playlists = useSelector((state: RootState) => state.playlists);
  const queue = useSelector((state: RootState) => state.playlistPlayback.queue);
  const track = useSelector((state: RootState) => state.playlistPlayback.track);
  const tagsById = useSelector(
    (state: RootState) => state.playlists.tags.byId,
  );
  // Read the tag ids from the LIVE track in the store (not the frozen copy in
  // playlistPlayback.track), so editing tags updates the player immediately
  // instead of only after the track is replayed.
  const liveTagIds = useSelector((state: RootState) =>
    track ? state.playlists.tracks[track.id]?.tagIds : undefined,
  );
  // The live track in the store (for the cover art, kept up to date if the
  // user changes the thumbnail while it's playing).
  const liveTrack = useSelector((state: RootState) =>
    track ? state.playlists.tracks[track.id] : undefined,
  );
  const noTrack = track?.title === undefined;
  const large = useMediaQuery(`(min-width: ${minWidthForLargeContext}px)`);

  // Resolve the current track's tags. useMemo so this only recomputes when the
  // tag ids or the tag definitions change (not on every playback tick).
  const tags = React.useMemo(
    () =>
      (liveTagIds ?? track?.tagIds ?? [])
        .map((id) => tagsById[id])
        .filter((tag): tag is Tag => Boolean(tag)),
    [liveTagIds, track, tagsById],
  );

  // Jump to the playlist the current track is playing from. When we're already
  // on a playlist page, replace the history entry instead of pushing — so
  // repeated jumps between playlists don't stack up and trap the back button.
  function goToPlaylist() {
    if (queue?.playlistId) {
      const onPlaylistPage = location.pathname.startsWith("/playlists/");
      navigate(`/playlists/${queue.playlistId}`, { replace: onPlaylistPage });
    }
  }
  const clickableSx = noTrack
    ? undefined
    : { cursor: "pointer", "&:hover": { textDecoration: "underline" } };

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 1.5,
        width: large ? "30%" : "100%",
      }}
    >
      {liveTrack && (
        <TrackThumbnail
          track={liveTrack}
          size={44}
          playlistImage={playlistImageUrl(
            queue ? playlists.playlists.byId[queue.playlistId] : undefined,
          )}
        />
      )}
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          flexGrow: 1,
        }}
      >
        <Typography
          variant="body2"
          onClick={noTrack ? undefined : goToPlaylist}
          title={noTrack ? undefined : "Go to playlist"}
          sx={{
            width: "100%",
            textAlign: large ? undefined : "center",
            ...clickableSx,
          }}
          noWrap
          gutterBottom
        >
          {noTrack ? "" : track.title}
        </Typography>
        <Typography
          variant="caption"
          color="rgba(255, 255, 255, 0.8)"
          onClick={noTrack ? undefined : goToPlaylist}
          sx={{
            width: "100%",
            textAlign: large ? undefined : "center",
            ...clickableSx,
          }}
          noWrap
        >
          {noTrack ? "" : playlists.playlists.byId[queue.playlistId]?.title}
        </Typography>
        {!noTrack && tags.length > 0 && (
          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 0.5,
              mt: 0.5,
              maxWidth: "100%",
              justifyContent: large ? "flex-start" : "center",
            }}
          >
            {tags.map((tag) => (
              <TagChip
                key={tag.id}
                tag={tag}
                sx={{ height: 18, fontSize: 11 }}
                onClick={() => navigate(`/search?tag=${tag.id}`)}
              />
            ))}
          </Box>
        )}
      </Box>
    </Box>
  );
}

function Controls({
  onPlaylistPrevious,
  onPlaylistNext,
}: Omit<PlaylistPlayerProps, "onPlaylistSeek">) {
  const dispatch = useDispatch();
  const playbackShuffle = useSelector(
    (state: RootState) => state.playlistPlayback.shuffle,
  );
  const disabled = useSelector(
    (state: RootState) => !Boolean(state.playlistPlayback.playback),
  );
  const playing = useSelector(
    (state: RootState) => state.playlistPlayback.playing,
  );
  const playbackRepeat = useSelector(
    (state: RootState) => state.playlistPlayback.repeat,
  );

  function handlePlay() {
    dispatch(playPause(!playing));
  }

  function handlRepeat() {
    switch (playbackRepeat) {
      case "off":
        dispatch(repeat("playlist"));
        break;
      case "playlist":
        dispatch(repeat("track"));
        break;
      case "track":
        dispatch(repeat("off"));
        break;
    }
  }

  function handleShuffle() {
    const newShuffle = !playbackShuffle;
    dispatch(shuffle(newShuffle));
  }

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        mt: -1,
        flexGrow: 1,
      }}
    >
      <IconButton aria-label="shuffle" onClick={handleShuffle}>
        <Shuffle color={playbackShuffle ? "primary" : undefined} />
      </IconButton>
      <IconButton
        disabled={disabled}
        aria-label="previous"
        onClick={() => onPlaylistPrevious()}
      >
        <Previous />
      </IconButton>
      <IconButton
        aria-label={playing ? "pause" : "play"}
        onClick={handlePlay}
        disabled={disabled}
      >
        {playing ? (
          <Pause sx={{ fontSize: "3rem" }} />
        ) : (
          <PlayArrow sx={{ fontSize: "3rem" }} />
        )}
      </IconButton>
      <IconButton
        disabled={disabled}
        aria-label="next"
        onClick={() => onPlaylistNext()}
      >
        <Next />
      </IconButton>
      <IconButton aria-label={`repeat ${playbackRepeat}`} onClick={handlRepeat}>
        {playbackRepeat === "off" ? (
          <RepeatIcon />
        ) : playbackRepeat === "playlist" ? (
          <RepeatIcon color="primary" />
        ) : (
          <RepeatOne color="primary" />
        )}
      </IconButton>
    </Box>
  );
}

function Volume() {
  const dispatch = useDispatch();
  const large = useMediaQuery(`(min-width: ${minWidthForLargeContext}px)`);

  const muted = useSelector((state: RootState) => state.playlistPlayback.muted);
  const volume = useSelector(
    (state: RootState) => state.playlistPlayback.volume,
  );

  function handleVolumeChange(_: Event, value: number | number[]) {
    dispatch(adjustVolume(value as number));
    // TODO: handle value isArray
    if (muted) {
      if (!Array.isArray(value) && value > 0) {
        dispatch(mute(false));
      }
    }
  }

  function handleMute() {
    dispatch(mute(!muted));
  }

  return (
    <Stack
      spacing={2}
      direction="row"
      sx={{ mb: 1, px: 1, width: large ? "30%" : "100%" }}
      alignItems="center"
    >
      <IconButton aria-label={muted ? "unmute" : "mute"} onClick={handleMute}>
        {muted ? <VolumeOff /> : <VolumeDown />}
      </IconButton>
      <VolumeSlider
        aria-label="Volume"
        value={muted ? 0 : volume}
        step={0.01}
        min={0}
        max={1}
        onChange={handleVolumeChange}
      />
      {!large && (
        <Box px={2} height="24px">
          <VolumeUp sx={{ color: "rgba(255,255,255,0.4)" }} />
        </Box>
      )}
    </Stack>
  );
}

function Time({ onPlaylistSeek }: Pick<PlaylistPlayerProps, "onPlaylistSeek">) {
  const playback = useSelector(
    (state: RootState) => state.playlistPlayback.playback,
  );

  function formatDuration(value: number) {
    const minute = Math.floor(value / 60);
    const secondLeft = value - minute * 60;
    return `${minute}:${secondLeft < 10 ? `0${secondLeft}` : secondLeft}`;
  }

  // Override the time slider when changing the value
  const [timeOverride, setTimeOverride] = useState<number | null>(null);
  // Commit the time value when letting go of the slider
  function handleTimeChange(_: Event, value: number | number[]) {
    setTimeOverride(null);
    // The slider can hand back a non-finite value when duration is 0 (track not
    // loaded yet); ignore those so we never seek to NaN.
    if (typeof value === "number" && Number.isFinite(value)) {
      onPlaylistSeek(value);
    }
  }

  const time = timeOverride === null ? playback?.progress || 0 : timeOverride;
  const duration = playback?.duration || 0;

  return (
    <Box>
      <TimeSlider
        aria-label="time-indicator"
        size="small"
        value={time}
        min={0}
        step={1}
        max={duration}
        disabled={!Boolean(playback) || duration <= 0}
        onChange={(_, value) => {
          if (typeof value === "number" && Number.isFinite(value)) {
            setTimeOverride(value);
          }
        }}
        onChangeCommitted={handleTimeChange}
      />
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          mt: -2,
        }}
      >
        <TinyText>{formatDuration(time)}</TinyText>
        <TinyText>-{formatDuration(duration - time)}</TinyText>
      </Box>
    </Box>
  );
}

export function PlaylistPlayer({
  onPlaylistNext,
  onPlaylistPrevious,
  onPlaylistSeek,
}: PlaylistPlayerProps) {
  const large = useMediaQuery(`(min-width: ${minWidthForLargeContext}px)`);

  if (large) {
    return (
      <>
        <Stack direction="row">
          <Title />
          <Controls
            onPlaylistNext={onPlaylistNext}
            onPlaylistPrevious={onPlaylistPrevious}
          />
          <Volume />
        </Stack>
        <Time onPlaylistSeek={onPlaylistSeek} />
      </>
    );
  } else {
    return (
      <>
        <Title />
        <Time onPlaylistSeek={onPlaylistSeek} />
        <Controls
          onPlaylistNext={onPlaylistNext}
          onPlaylistPrevious={onPlaylistPrevious}
        />
        <Volume />
      </>
    );
  }
}
