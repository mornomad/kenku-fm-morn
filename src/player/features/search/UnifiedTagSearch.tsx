import React, { useState } from "react";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";

import { Tag } from "../playlists/playlistsSlice";
import { TagChip } from "../playlists/TagChip";

type UnifiedTagSearchProps = {
  allTags: Tag[];
  selectedTags: Tag[];
  onSelectedChange: (tagIds: string[]) => void;
  nameQuery: string;
  onNameQueryChange: (query: string) => void;
  tagCounts: Record<string, number>;
};

// A single search bar. The bar's text is the source of truth: a leading
// apostrophe (') means "search by name" — everything after it filters track
// titles. Without it, the text searches tags. Pressing space on an empty bar
// inserts the ' (entering name search); deleting the ' returns to tag search.
export function UnifiedTagSearch({
  allTags,
  selectedTags,
  onSelectedChange,
  nameQuery,
  onNameQueryChange,
  tagCounts,
}: UnifiedTagSearchProps) {
  const [input, setInput] = useState("");
  const isNameMode = input.startsWith("'");

  // Keep the bar's text and the parent's name query in sync from one place.
  function applyInput(value: string) {
    setInput(value);
    onNameQueryChange(value.startsWith("'") ? value.slice(1) : "");
  }

  return (
    <Box>
      <Autocomplete
        multiple
        options={allTags}
        value={selectedTags}
        onChange={(_event, value) => {
          onSelectedChange(value.map((tag) => tag.id));
          // Clear the transient tag-search text after picking a tag.
          applyInput("");
        }}
        inputValue={input}
        onInputChange={(_event, value, reason) => {
          // Only react to real typing / the clear button. Ignore "reset" (which
          // fires on blur and after selection) so it never wipes what was typed.
          if (reason === "input" || reason === "clear") {
            applyInput(value);
          }
        }}
        clearOnBlur={false}
        getOptionLabel={(option) => option.name}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        filterSelectedOptions
        // Highlight the first match so Enter/Tab complete it (with a visual cue).
        autoHighlight
        forcePopupIcon={false}
        // No tag suggestions while searching by name.
        filterOptions={isNameMode ? () => [] : undefined}
        noOptionsText={isNameMode ? "Searching by name…" : "No tags"}
        renderTags={(value, getTagProps) =>
          value.map((tag, index) => {
            const { key } = getTagProps({ index });
            return (
              <TagChip
                key={key}
                tag={tag}
                onDelete={() =>
                  onSelectedChange(
                    selectedTags.filter((t) => t.id !== tag.id).map((t) => t.id),
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
            // Focus the bar as soon as the search screen opens (single click
            // from the home search button).
            autoFocus
            label={isNameMode ? "Search by name" : "Search by tags"}
            placeholder={
              isNameMode
                ? "Track name"
                : selectedTags.length === 0
                  ? "Type a tag · space → name search"
                  : undefined
            }
            helperText={
              isNameMode
                ? "Searching by name — delete the ' to search tags"
                : "Press space to switch to name search"
            }
            inputProps={{
              ...params.inputProps,
              onKeyDown: (event) => {
                const value = (event.target as HTMLInputElement).value;
                const inNameMode = value.startsWith("'");
                // Space on an empty bar inserts the ' to start a name search.
                if (event.key === " " && value === "") {
                  event.preventDefault();
                  event.stopPropagation();
                  applyInput("'");
                  return;
                }
                // Tab autocompletes the typed text to the best matching tag
                // (prefix first, e.g. "ba" → "battle") and adds it as a filter.
                if (event.key === "Tab" && !inNameMode && value.trim() !== "") {
                  const text = value.trim().toLowerCase();
                  const taken = new Set(selectedTags.map((tag) => tag.id));
                  const match =
                    allTags.find(
                      (tag) =>
                        !taken.has(tag.id) &&
                        tag.name.toLowerCase().startsWith(text),
                    ) ??
                    allTags.find(
                      (tag) =>
                        !taken.has(tag.id) &&
                        tag.name.toLowerCase().includes(text),
                    );
                  if (match) {
                    event.preventDefault();
                    event.stopPropagation();
                    onSelectedChange([
                      ...selectedTags.map((tag) => tag.id),
                      match.id,
                    ]);
                    applyInput("");
                    return;
                  }
                }
                // Otherwise let the Autocomplete handle the key as usual.
                // (cast: TextField widens the element type to include textarea.)
                params.inputProps.onKeyDown?.(
                  event as React.KeyboardEvent<HTMLInputElement>,
                );
              },
            }}
          />
        )}
      />
    </Box>
  );
}
