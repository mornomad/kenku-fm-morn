import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import Autocomplete from "@mui/material/Autocomplete";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";

import { RootState } from "../../app/store";
import { tagTracks, Tag } from "./playlistsSlice";
import { TagChip } from "./TagChip";

type BulkTagDialogProps = {
  open: boolean;
  trackIds: string[];
  onClose: () => void;
};

// Add and/or remove tags across many selected tracks at once.
export function BulkTagDialog({ open, trackIds, onClose }: BulkTagDialogProps) {
  const dispatch = useDispatch();
  const tagsById = useSelector(
    (state: RootState) => state.playlists.tags.byId,
  );
  const tagAllIds = useSelector(
    (state: RootState) => state.playlists.tags.allIds,
  );
  const allTags = tagAllIds.map((id) => tagsById[id]);

  const [addTags, setAddTags] = useState<Tag[]>([]);
  const [removeTags, setRemoveTags] = useState<Tag[]>([]);

  // Reset the pickers each time the dialog opens.
  useEffect(() => {
    if (open) {
      setAddTags([]);
      setRemoveTags([]);
    }
  }, [open]);

  function handleApply() {
    dispatch(
      tagTracks({
        trackIds,
        addTagIds: addTags.map((tag) => tag.id),
        removeTagIds: removeTags.map((tag) => tag.id),
      }),
    );
    onClose();
  }

  function renderTagInput(
    label: string,
    value: Tag[],
    setValue: (tags: Tag[]) => void,
  ) {
    return (
      <Autocomplete
        multiple
        options={allTags}
        value={value}
        onChange={(_event, next) => setValue(next)}
        getOptionLabel={(option) => option.name}
        isOptionEqualToValue={(option, v) => option.id === v.id}
        filterSelectedOptions
        renderTags={(tags, getTagProps) =>
          tags.map((tag, index) => {
            const { key } = getTagProps({ index });
            return (
              <TagChip
                key={key}
                tag={tag}
                onDelete={() => setValue(value.filter((t) => t.id !== tag.id))}
              />
            );
          })
        }
        renderInput={(params) => (
          <TextField
            {...params}
            margin="dense"
            variant="standard"
            label={label}
            InputLabelProps={{ shrink: true }}
          />
        )}
      />
    );
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      onKeyDown={(e) => e.stopPropagation()}
    >
      <DialogTitle>
        Tag {trackIds.length} track{trackIds.length === 1 ? "" : "s"}
      </DialogTitle>
      <DialogContent>
        {renderTagInput("Add tags", addTags, setAddTags)}
        {renderTagInput("Remove tags", removeTags, setRemoveTags)}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleApply}
          disabled={addTags.length === 0 && removeTags.length === 0}
        >
          Apply
        </Button>
      </DialogActions>
    </Dialog>
  );
}
