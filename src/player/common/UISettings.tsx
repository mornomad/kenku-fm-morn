import React, { useState } from "react";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import SmallGridMode from '@mui/icons-material/ViewCompact';
import NormalGridMode from '@mui/icons-material/Apps';
import BigGridMode from '@mui/icons-material/GridView';
import FixedWidthContainerIcon from '@mui/icons-material/WidthNormal';
import FullWidthContainerIcon from '@mui/icons-material/WidthFull';

import { setUISetting } from "./UISettingsSlice";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../app/store";

export function UISettings() {
  const uisettings = useSelector((state: RootState) => state.uisettings);
  const dispatch = useDispatch();

  /*const [xsColumnsNumber, setXsColumnsNumber] = useState(6);
  const [smColumnsNumber, setSmColumnsNumber] = useState(4);
  const [mdColumnsNumber, setMdColumnsNumber] = useState(3);*/

  const [gridMode, setGridMode] = useState(uisettings.byName["gridmode"].value);
  const [containerWidth, setContainerWidth] = useState(uisettings.byName["containerwidth"].value);

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

  return (
      <Container
          sx={{
            display: "flex",
            flexDirection: "row",
            overflow: "hidden",
            mb: 0,
            height: "60px"
          }}
        >
        <Stack
          p={2}
          direction="row"
          sx={{
            gap: 5,
            padding: "0px !important",
            paddingTop: "5px !important",
            position: "absolute",
            zIndex: 11
          }}
        >

          <Stack
            p={2}
            direction="column"
            alignItems="center"
            sx={{
              padding: "0px !important"
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{
                padding: "0px !important"
              }}
            >
              Grid size
            </Typography>
            <Stack
              p={2}
              direction="row"
              alignItems="center"
              sx={{
                padding: "0px !important"
              }}
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
            p={2}
            direction="column"
            alignItems="center"
            sx={{
              padding: "0px !important",
            }}
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
              p={2}
              direction="row"
              alignItems="center"
              sx={{
                padding: "0px !important"
              }}
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
      </Container>
  );
}