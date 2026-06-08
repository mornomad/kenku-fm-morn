import React from "react";
import { v4 as uuid } from "uuid";
import Box from "@mui/material/Box";
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
import { addTag, editTrack, Tag, Track } from "./playlistsSlice";
import { nextTagColor } from "./tagColors";
import { TagChip } from "./TagChip";
import { TrackThumbnail } from "./TrackThumbnail";
import { INHERIT_PLAYLIST } from "./thumbnailUrl";
import { AudioSelector } from "../../common/AudioSelector";
import { encodeFilePath } from "../../../renderer/common/drop";

type TrackSettingsProps = {
  track: Track;
  // The track's playlist image, used for the cover preview / fallback.
  playlistImage?: string;
  open: boolean;
  onClose: () => void;
};

export function TrackSettings({
  track,
  playlistImage,
  open,
  onClose,
}: TrackSettingsProps) {
  const dispatch = useDispatch();

  // The central tag store. `byId` resolves an id to a Tag; `allIds` gives the
  // full list (in order) to offer as autocomplete suggestions.
  const tagsById = useSelector(
    (state: RootState) => state.playlists.tags.byId
  );
  const tagAllIds = useSelector(
    (state: RootState) => state.playlists.tags.allIds
  );

  // All tags, as the option list for the Autocomplete.
  const allTags = tagAllIds.map((id) => tagsById[id]);
  // This track's currently-applied tags, resolved from its tagIds. The filter
  // drops any id whose tag was deleted (defensive — removeTag should prevent it).
  const selectedTags = track.tagIds
    .map((id) => tagsById[id])
    .filter((tag): tag is Tag => Boolean(tag));

  // Fired whenever the user adds or removes a tag in the Autocomplete. The new
  // value is a mix of existing Tag objects and freshly-typed strings (because
  // of `freeSolo`). We turn every entry into a tag id, creating new tags as
  // needed, then save the resulting id list onto the track.
  function handleTagsChange(
    _event: React.SyntheticEvent,
    value: (Tag | string)[]
  ) {
    const tagIds: string[] = [];
    let created = 0;
    for (const item of value) {
      if (typeof item === "string") {
        const name = item.trim();
        if (!name) continue;
        // Reuse an existing tag with the same name (case-insensitive) rather
        // than creating a duplicate.
        const existing = allTags.find(
          (tag) => tag.name.toLowerCase() === name.toLowerCase()
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
    dispatch(editTrack({ id: track.id, tagIds }));
  }

  function handleTitleChange(event: React.ChangeEvent<HTMLInputElement>) {
    dispatch(editTrack({ id: track.id, title: event.target.value }));
  }

  function handleTitleStringChange(title: string) {
    dispatch(editTrack({ id: track.id, title }));
  }

  function handleURLChange(url: string) {
    dispatch(editTrack({ id: track.id, url }));
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onClose();
  }

  // Pick a custom cover image via the native file dialog (in the main process)
  // — overrides the embedded art for this track.
  async function handleChooseImage() {
    const path = await window.player.showOpenImageDialog();
    if (path) {
      dispatch(editTrack({ id: track.id, thumbnail: encodeFilePath(path) }));
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      // Stop key events from propagating to prevent the track drag and drop from stealing the space bar
      onKeyDown={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <DialogTitle>Edit Track</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <AudioSelector
            value={track.url}
            onChange={handleURLChange}
            onFileName={handleTitleStringChange}
          />
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
            value={track.title}
            onChange={handleTitleChange}
          />
          <Autocomplete
            multiple
            freeSolo
            options={allTags}
            value={selectedTags}
            onChange={handleTagsChange}
            // How to display a tag in the list/input: by its name. An option can
            // momentarily be a raw string while the user types (freeSolo).
            getOptionLabel={(option) =>
              typeof option === "string" ? option : option.name
            }
            // Match selected values to options by id, not by object identity.
            // freeSolo widens the type to `string | Tag`, so guard the strings.
            isOptionEqualToValue={(option, value) =>
              typeof option !== "string" &&
              typeof value !== "string" &&
              option.id === value.id
            }
            // Hide already-selected tags from the suggestion dropdown.
            filterSelectedOptions
            // Render each selected tag with the shared TagChip so it's tinted
            // with the tag's color AND supports right-click → recolor right here
            // in the dialog (no need to close and reopen to change a color).
            // A freeSolo option can briefly be a raw string while typing — show
            // a plain chip for that transient case.
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { key, onDelete } = getTagProps({ index });
                if (typeof option === "string") {
                  return <Chip key={key} label={option} onDelete={onDelete} />;
                }
                return (
                  <TagChip
                    key={key}
                    tag={option}
                    // getTagProps' onDelete takes the click event; TagChip's
                    // prop is parameterless, so cast to line the types up.
                    onDelete={onDelete as () => void}
                  />
                );
              })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                margin="dense"
                variant="standard"
                label="Tags"
                placeholder="Add tag"
                InputLabelProps={{ shrink: true }}
              />
            )}
          />
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 2 }}>
            <TrackThumbnail
              track={track}
              playlistImage={playlistImage}
              size={56}
            />
            <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
              {/* type="button" so these don't submit the dialog form. */}
              <Button
                type="button"
                size="small"
                variant="outlined"
                onClick={handleChooseImage}
              >
                Set custom image
              </Button>
              {playlistImage && track.thumbnail !== INHERIT_PLAYLIST ? (
                <Button
                  type="button"
                  size="small"
                  onClick={() =>
                    dispatch(
                      editTrack({
                        id: track.id,
                        thumbnail: INHERIT_PLAYLIST,
                      }),
                    )
                  }
                >
                  Use playlist image
                </Button>
              ) : null}
              {track.thumbnail ? (
                <Button
                  type="button"
                  size="small"
                  onClick={() =>
                    dispatch(editTrack({ id: track.id, thumbnail: "" }))
                  }
                >
                  Reset to default
                </Button>
              ) : null}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button type="submit">Done</Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
