import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import Back from "@mui/icons-material/ChevronLeftRounded";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { RootState } from "../../app/store";
import { setSearchMode, SearchMode } from "./settingsSlice";

export function Settings() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const searchMode = useSelector(
    (state: RootState) => state.settings.searchMode,
  );

  return (
    <Container sx={{ height: "100vh", overflowY: "auto", pb: "248px" }}>
      <Stack p={2} direction="row" alignItems="center" gap={2}>
        <IconButton onClick={() => navigate(-1)}>
          <Back />
        </IconButton>
        <Typography variant="h4" noWrap>
          Settings
        </Typography>
      </Stack>

      <Box px={2} mt={2}>
        <Typography variant="h6">Search bar</Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          How the search screen filters tracks.
        </Typography>
        <FormControl>
          <RadioGroup
            value={searchMode}
            onChange={(event) =>
              dispatch(setSearchMode(event.target.value as SearchMode))
            }
          >
            <FormControlLabel
              value="split"
              control={<Radio />}
              label={
                <Box>
                  <Typography>Separate fields</Typography>
                  <Typography variant="caption" color="text.secondary">
                    One field to filter by tags and another to filter by title.
                  </Typography>
                </Box>
              }
            />
            <FormControlLabel
              value="unified"
              control={<Radio />}
              label={
                <Box>
                  <Typography>Single bar</Typography>
                  <Typography variant="caption" color="text.secondary">
                    One bar that searches tags by default. Press space on an
                    empty bar to insert a ' and search by name; delete the ' to
                    go back to tags.
                  </Typography>
                </Box>
              }
            />
          </RadioGroup>
        </FormControl>
      </Box>
    </Container>
  );
}
