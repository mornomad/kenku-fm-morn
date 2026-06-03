import React from "react";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Autocomplete from "@mui/material/Autocomplete";

import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../app/store";
import { editPlaylist, Playlist, Tag } from "./playlistsSlice";
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

  function handleDefaultTagsChange(_event: React.SyntheticEvent, value: Tag[]) {
    dispatch(
      editPlaylist({
        id: playlist.id,
        defaultTagIds: value.map((tag) => tag.id),
      }),
    );
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
            options={allTags}
            value={defaultTags}
            onChange={handleDefaultTagsChange}
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
                      handleDefaultTagsChange(
                        {} as React.SyntheticEvent,
                        value.filter((t) => t.id !== tag.id),
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
