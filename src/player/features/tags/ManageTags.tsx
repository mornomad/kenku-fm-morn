import React, { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { v4 as uuid } from "uuid";

import Back from "@mui/icons-material/ChevronLeftRounded";
import Delete from "@mui/icons-material/DeleteRounded";
import Add from "@mui/icons-material/AddRounded";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

import { RootState } from "../../app/store";
import { addTag, editTag, removeTag, Tag } from "../playlists/playlistsSlice";
import { nextTagColor } from "../playlists/tagColors";
import { TagColorPicker } from "../playlists/TagColorPicker";

export function ManageTags() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const tags = useSelector((state: RootState) => state.playlists.tags);
  const tracks = useSelector((state: RootState) => state.playlists.tracks);

  // How many tracks use each tag.
  const counts = useMemo(() => {
    const result: Record<string, number> = {};
    for (const track of Object.values(tracks)) {
      for (const id of track.tagIds) {
        result[id] = (result[id] ?? 0) + 1;
      }
    }
    return result;
  }, [tracks]);

  const allTags = tags.allIds.map((id) => tags.byId[id]);

  const [newName, setNewName] = useState("");

  function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    // Don't create a duplicate of an existing tag (case-insensitive).
    const existing = allTags.find(
      (tag) => tag.name.toLowerCase() === name.toLowerCase(),
    );
    if (!existing) {
      dispatch(
        addTag({ id: uuid(), name, color: nextTagColor(tags.allIds.length) }),
      );
    }
    setNewName("");
  }

  function handleDelete(tag: Tag) {
    const count = counts[tag.id] ?? 0;
    if (count > 0) {
      const ok = window.confirm(
        `Delete "${tag.name}"? It will be removed from ${count} track${
          count === 1 ? "" : "s"
        }.`,
      );
      if (!ok) return;
    }
    dispatch(removeTag(tag.id));
  }

  return (
    <Container sx={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <Stack p={2} direction="row" alignItems="center" gap={2}>
        <IconButton onClick={() => navigate(-1)}>
          <Back />
        </IconButton>
        <Typography variant="h4" noWrap>
          Manage Tags
        </Typography>
      </Stack>

      <Stack px={2} direction="row" gap={1} alignItems="flex-end">
        <TextField
          variant="standard"
          label="New tag"
          placeholder="Name"
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleCreate();
          }}
          sx={{ flexGrow: 1 }}
        />
        <Button
          onClick={handleCreate}
          disabled={!newName.trim()}
          startIcon={<Add />}
        >
          Add
        </Button>
      </Stack>

      <Box sx={{ flex: 1, overflowY: "auto", px: 2, mt: 2, pb: "248px" }}>
        {allTags.length === 0 ? (
          <Typography color="text.secondary">
            No tags yet. Add tags to a track, or create one above.
          </Typography>
        ) : (
          <List>
            {allTags.map((tag) => (
              <ListItem
                key={tag.id}
                disableGutters
                secondaryAction={
                  <Tooltip title="Delete tag">
                    <IconButton edge="end" onClick={() => handleDelete(tag)}>
                      <Delete />
                    </IconButton>
                  </Tooltip>
                }
              >
                <Stack
                  direction="row"
                  gap={2}
                  alignItems="center"
                  sx={{ width: "100%", pr: 6 }}
                >
                  <TagColorPicker
                    color={tag.color}
                    onChange={(color) =>
                      dispatch(editTag({ id: tag.id, color }))
                    }
                  />
                  <TextField
                    variant="standard"
                    value={tag.name}
                    onChange={(event) =>
                      dispatch(editTag({ id: tag.id, name: event.target.value }))
                    }
                    sx={{ flexGrow: 1 }}
                  />
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ whiteSpace: "nowrap" }}
                  >
                    {counts[tag.id] ?? 0}{" "}
                    {(counts[tag.id] ?? 0) === 1 ? "track" : "tracks"}
                  </Typography>
                </Stack>
              </ListItem>
            ))}
          </List>
        )}
      </Box>
    </Container>
  );
}
