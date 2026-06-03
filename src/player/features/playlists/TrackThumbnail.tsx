import React, { useEffect, useMemo, useState } from "react";
import Box from "@mui/material/Box";
import MusicNote from "@mui/icons-material/MusicNoteRounded";
import { SxProps, Theme } from "@mui/material/styles";

import { Track } from "./playlistsSlice";
import { trackThumbnailUrl } from "./thumbnailUrl";

type TrackThumbnailProps = {
  track: Track;
  // The track's playlist image, used as a fallback when the track has no art.
  playlistImage?: string;
  size?: number;
  sx?: SxProps<Theme>;
};

// A track's cover art. We try the track's own art first; if it's missing (the
// embedded-art route 404s) we fall back to the playlist image, and if that's
// also unavailable we show the music-note icon. Uses a plain <img> so we can
// react to load errors and advance through the candidates.
export function TrackThumbnail({
  track,
  playlistImage,
  size = 40,
  sx,
}: TrackThumbnailProps) {
  const primary = trackThumbnailUrl(track, playlistImage);

  const candidates = useMemo(() => {
    const list: string[] = [];
    if (primary) list.push(primary);
    if (playlistImage && playlistImage !== primary) list.push(playlistImage);
    return list;
  }, [primary, playlistImage]);

  // Reset to the first candidate whenever the set of candidates changes.
  const key = candidates.join("|");
  const [index, setIndex] = useState(0);
  useEffect(() => {
    setIndex(0);
  }, [key]);

  const src = index < candidates.length ? candidates[index] : undefined;

  return (
    <Box
      sx={{
        width: size,
        height: size,
        flexShrink: 0,
        borderRadius: "6px",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "rgba(255,255,255,0.08)",
        color: "rgba(255,255,255,0.5)",
        ...sx,
      }}
    >
      {src ? (
        <img
          src={src}
          alt=""
          onError={() => setIndex((i) => i + 1)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : (
        <MusicNote fontSize="small" />
      )}
    </Box>
  );
}
