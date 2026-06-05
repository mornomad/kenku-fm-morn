import React from "react";
import { v4 as uuid } from "uuid";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Autocomplete from "@mui/material/Autocomplete";
import Chip from "@mui/material/Chip";

import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../app/store";
import { addTag, editPlaylist, Playlist, Tag } from "./playlistsSlice";
import { nextTagColor } from "./tagColors";
import { TagChip } from "./TagChip";
import { ImageSelector } from "../../common/ImageSelector";

type PlaylistSettingsProps = {
  playlist: Playlist;
  open: boolean;
  onClose: () => void;
};

export function PlaylistSettings({
  playlist,
  open,
  onClose,
}: PlaylistSettingsProps) {
  const dispatch = useDispatch();

  const tagsById = useSelector(
    (state: RootState) => state.playlists.tags.byId,
  );
  const tagAllIds = useSelector(
    (state: RootState) => state.playlists.tags.allIds,
  );
  const allTags = tagAllIds.map((id) => tagsById[id]);
  const defaultTags = (playlist.defaultTagIds ?? [])
    .map((id) => tagsById[id])
    .filter((tag): tag is Tag => Boolean(tag));

  function handleTitleChange(event: React.ChangeEvent<HTMLInputElement>) {
    dispatch(editPlaylist({ id: playlist.id, title: event.target.value }));
  }

  function handleDefaultTagsChange(
    _event: React.SyntheticEvent,
    value: (Tag | string)[],
  ) {
    // Like the track tag editor: turn each entry into a tag id, creating new
    // tags for any freshly-typed names (freeSolo strings).
    const tagIds: string[] = [];
    let created = 0;
    for (const item of value) {
      if (typeof item === "string") {
        const name = item.trim();
        if (!name) continue;
        const existing = allTags.find(
          (tag) => tag.name.toLowerCase() === name.toLowerCase(),
        );
        if (existing) {
          if (!tagIds.includes(existing.id)) tagIds.push(existing.id);
        } else {
          const tag: Tag = {
            id: uuid(),
            name,
            color: nextTagColor(tagAllIds.length + created),
          };
          dispatch(addTag(tag));
          tagIds.push(tag.id);
          created += 1;
        }
      } else if (!tagIds.includes(item.id)) {
        tagIds.push(item.id);
      }
    }
    dispatch(editPlaylist({ id: playlist.id, defaultTagIds: tagIds }));
  }

  function handleBackgroundChange(background: string) {
    dispatch(editPlaylist({ id: playlist.id, background }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onClose();
  }

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Edit Playlist</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <TextField
            margin="dense"
            id="name"
            label="Name"
            fullWidth
            variant="standard"
            autoComplete="off"
            InputLabelProps={{
              shrink: true,
            }}
            value={playlist.title}
            onChange={handleTitleChange}
          />
          <Autocomplete
            multiple
            freeSolo
            options={allTags}
            value={defaultTags}
            onChange={handleDefaultTagsChange}
            getOptionLabel={(option) =>
              typeof option === "string" ? option : option.name
            }
            isOptionEqualToValue={(option, value) =>
              typeof option !== "string" &&
              typeof value !== "string" &&
              option.id === value.id
            }
            filterSelectedOptions
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { key } = getTagProps({ index });
                if (typeof option === "string") {
                  return <Chip key={key} label={option} />;
                }
                return (
                  <TagChip
                    key={key}
                    tag={option}
                    onDelete={() =>
                      dispatch(
                        editPlaylist({
                          id: playlist.id,
                          defaultTagIds: (playlist.defaultTagIds ?? []).filter(
                            (id) => id !== option.id,
                          ),
                        }),
                      )
                    }
                  />
                );
              })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                margin="dense"
                variant="standard"
                label="Default tags for new tracks"
                placeholder="Add tag"
                helperText="Tracks added to this playlist start with these tags"
                InputLabelProps={{ shrink: true }}
              />
            )}
          />
          <ImageSelector
            value={playlist.background}
            onChange={handleBackgroundChange}
          />
        </DialogContent>
        <DialogActions>
          <Button type="submit">Done</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
