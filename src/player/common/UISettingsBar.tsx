import React, { useEffect, useState } from "react";
import Container from "@mui/material/Container";
import Box from '@mui/material/Box';
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import SmallGridMode from '@mui/icons-material/ViewCompact';
import NormalGridMode from '@mui/icons-material/Apps';
import BigGridMode from '@mui/icons-material/GridView';
import FixedWidthContainerIcon from '@mui/icons-material/WidthNormal';
import FullWidthContainerIcon from '@mui/icons-material/WidthFull';
import DisplayUISettingsIcon from '@mui/icons-material/Visibility';
import { useLocation } from "react-router-dom";

import { setUISetting } from "./UISettingsSlice";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../app/store";

import { BrowserWindow, ipcMain, ipcRenderer } from "electron";

export function UISettingsBar() {
  const location = useLocation();
  const uisettings = useSelector((state: RootState) => state.uisettings);
  const dispatch = useDispatch();

  const isPlaylistView = /^\/playlists\/[a-zA-Z0-9-]+$/.test(location.pathname);
  const isSoundboardsView = /^\/soundboards\/[a-zA-Z0-9-]+$/.test(location.pathname);

  const [gridMode, setGridMode] = useState(uisettings.byName["gridmode"].value);
  const [containerWidth, setContainerWidth] = useState(uisettings.byName["containerwidth"].value);
  const [playlistContainerWidth, setPlaylistContainerWidth] = useState(uisettings.byName["playlistcontainerwidth"]?.value);
  const [soundboardContainerWidth, setSoundboardContainerWidth] = useState(uisettings.byName["soundboardcontainerwidth"]?.value);
  const [displayUISettingsBar, setDisplayUISettingsBar] = useState(uisettings.byName["displayuisettingsbar"].value);

  function toggleDisplayUISettingsBar() {
    setDisplayUISettingsBar(displayUISettingsBar == "true" ? "false" : "true");
    window.player.sendUISettingToSettingsWindow(
      "displayuisettingsbar",
      uisettings.byName["displayuisettingsbar"].value == "true" ? "false" : "true"
    );
    dispatch(setUISetting({ name: "displayuisettingsbar", value: displayUISettingsBar == "true" ? "false" : "true" }));
  }

  function saveGridMode(mode: string) {
    dispatch(setUISetting({ name: "gridmode", value: mode }));
    if (mode == "small") {
      dispatch(setUISetting({ name: "xscolumnsnumber", value: '4' }));
      dispatch(setUISetting({ name: "smcolumnsnumber", value: '3' }));
      dispatch(setUISetting({ name: "mdcolumnsnumber", value: '2' }));
      dispatch(setUISetting({ name: "listitemheight", value: "100px" }));
    }
    if (mode == "normal") {
      dispatch(setUISetting({ name: "xscolumnsnumber", value: '6' }));
      dispatch(setUISetting({ name: "smcolumnsnumber", value: '4' }));
      dispatch(setUISetting({ name: "mdcolumnsnumber", value: '3' }));
      dispatch(setUISetting({ name: "listitemheight", value: "200px" }));
    }
    if (mode == "big") {
      dispatch(setUISetting({ name: "xscolumnsnumber", value: '12' }));
      dispatch(setUISetting({ name: "smcolumnsnumber", value: '6' }));
      dispatch(setUISetting({ name: "mdcolumnsnumber", value: '4' }));
      dispatch(setUISetting({ name: "listitemheight", value: "300px" }));
    }
    setGridMode(mode);
  }
  function saveContainerWidth(width: string) {
    dispatch(setUISetting({ name: "containerwidth", value: width }));
    setContainerWidth(width);
  }
  function savePlaylistContainerWidth(width: string) {
    dispatch(setUISetting({ name: "playlistcontainerwidth", value: width }));
    setPlaylistContainerWidth(width);
  }
  function saveSoundboardContainerWidth(width: string) {
    dispatch(setUISetting({ name: "soundboardcontainerwidth", value: width }));
    setSoundboardContainerWidth(width);
  }

  useEffect(() => {
    window.player.on("SEND_UI_SETTING_TO_PLAYER_WINDOW", (args) => {
      const name = args[0];
      const value = args[1];
      dispatch(setUISetting({ name: name, value: value }));
      if (name == "displayuisettingsbar") {
        setDisplayUISettingsBar(value);
      }
    });
    return () => {
    };
  }, []);

  const playlistsAndSoundboardsUISettings = (
    <Stack
      direction="column"
    >
      <Stack
        direction="row"
        sx={{
          gap: 5,
        }}
      >
        <Stack
          direction="column"
          alignItems="center"
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              padding: "0px !important"
            }}
          >
            Playlist card size
          </Typography>
          <Stack
            direction="row"
            alignItems="center"
          >
            <IconButton
              sx={{
                color: gridMode == "small" ? "white" : "grey"
              }}
              onClick={() => saveGridMode("small")}
            >
              <SmallGridMode />
            </IconButton>
            <IconButton
              sx={{
                color: gridMode == "normal" ? "white" : "grey"
              }}
              onClick={() => saveGridMode("normal")}
            >
              <NormalGridMode />
            </IconButton>
            <IconButton
              sx={{
                color: gridMode == "big" ? "white" : "grey"
              }}
              onClick={() => saveGridMode("big")}
            >
              <BigGridMode />
            </IconButton>
          </Stack>
        </Stack>

        <Stack
          direction="column"
          alignItems="center"
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              padding: "0px !important"
            }}
          >
            Container width
          </Typography>
          <Stack
            direction="row"
            alignItems="center"
          >
            <IconButton
              sx={{
                color: containerWidth == "fixed" ? "white" : "grey"
              }}
              onClick={() => saveContainerWidth("fixed")}>
              <FixedWidthContainerIcon />
            </IconButton>
            <IconButton
              sx={{
                color: containerWidth == "full" ? "white" : "grey"
              }}
              onClick={() => saveContainerWidth("full")}
            >
              <FullWidthContainerIcon />
            </IconButton>
          </Stack>
        </Stack>
      </Stack>
      <Typography
        variant="caption"
        color="text.secondary"
        textAlign="center"
      >
        Playlists & Soundboards UI settings
      </Typography>
    </Stack>
  );

  const playlistTracksUISettings = (
    <Stack
      direction="column"
    >
      <Stack
        direction="column"
        alignItems="center"
      >
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            padding: "0px !important"
          }}
        >
          Container width
        </Typography>
        <Stack
          direction="row"
          alignItems="center"
        >
          <IconButton
            sx={{
              color: playlistContainerWidth == "fixed" ? "white" : "grey"
            }}
            onClick={() => savePlaylistContainerWidth("fixed")}>
            <FixedWidthContainerIcon />
          </IconButton>
          <IconButton
            sx={{
              color: playlistContainerWidth == "full" ? "white" : "grey"
            }}
            onClick={() => savePlaylistContainerWidth("full")}
          >
            <FullWidthContainerIcon />
          </IconButton>
        </Stack>
      </Stack>
      <Typography
        variant="caption"
        color="text.secondary"
        textAlign="center"
      >
        Playlist UI settings
      </Typography>
    </Stack>
  );

  const soundboardTracksUISettings = (
    <Stack
      direction="column"
      justifyContent="space-between"
      sx={{
        height: "100%"
      }}
    >
      <Stack
        direction="column"
        alignItems="center"
      >
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            padding: "0px !important"
          }}
        >
          No UI Settings here
        </Typography>
      </Stack>
      <Typography
        variant="caption"
        color="text.secondary"
        textAlign="center"
      >
        Soundboard UI settings
      </Typography>
    </Stack>
  );


  return (
      <Container
          sx={{
            display: displayUISettingsBar == "true" ? "flex" : "none",
            flexDirection: "row",
            overflow: "hidden",
            mb: 0,
            height: "100px",
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{
                width: "100%",
                maxWidth: "100%",
            }}
          >
            <Stack
              direction="row"
              gap={5}
            >
              <Stack
                direction="column"
                sx={{
                  borderBottom: "1px solid white",
                  display: isPlaylistView || isSoundboardsView ? "none" : "flex",
                }}
              >
                {playlistsAndSoundboardsUISettings}
              </Stack>
              <Stack
                direction="column"
                sx={{
                  borderBottom: "1px solid white",
                  display: isPlaylistView ? "flex" : "none",
                }}
              >
                {playlistTracksUISettings}
              </Stack>
              <Stack
                direction="column"
                sx={{
                  borderBottom: "1px solid white",
                  display: isSoundboardsView ? "flex" : "none",
                }}
              >
                {soundboardTracksUISettings}
              </Stack>
            </Stack>
            <IconButton
              sx={{
                color: displayUISettingsBar == "true" ? "white" : "grey"
              }}
              onClick={() => toggleDisplayUISettingsBar()}
            >
              <DisplayUISettingsIcon />
            </IconButton>
          </Stack>

      </Container>
  );
}