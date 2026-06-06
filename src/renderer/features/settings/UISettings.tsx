import React, { useEffect, useState } from "react";

import Stack from "@mui/material/Stack";
import FormGroup from "@mui/material/FormGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";

import { RootState } from "../../app/store";
import { setUISetting } from "../../../player/common/UISettingsSlice";
import { useDispatch, useSelector } from "react-redux";

import { showWindowControls } from "../../common/showWindowControls";

type SettingsProps = {
  open: boolean;
  onClose: () => void;
};

export function UISettings({ open, onClose }: SettingsProps) {
  const uisettings = useSelector((state: RootState) => state.uisettings);
  const dispatch = useDispatch();

  const [displayUISettingsBar, setDisplayUISettingsBar] = useState(uisettings.byName["displayuisettingsbar"]?.value);

  function handleDisplayUISettingsBarToggle() {
    dispatch(
      setUISetting(
        {
          name: "displayuisettingsbar",
          value: uisettings.byName["displayuisettingsbar"].value == "true" ? "false" : "true"
        }
      )

    );
    window.kenku.sendUISettingToPlayerWindow(
      "displayuisettingsbar",
      uisettings.byName["displayuisettingsbar"].value == "true" ? "false" : "true"
    );
    setDisplayUISettingsBar(uisettings.byName["displayuisettingsbar"].value == "true" ? "false" : "true");
  }

  useEffect(() => {
    window.kenku.on("SEND_UI_SETTING_TO_SETTINGS_WINDOW", (args) => {
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

  const otherSettings = (
    <Stack spacing={1}>
      <FormGroup>
        <FormControlLabel
          control={
            <Switch
              checked={displayUISettingsBar == "true"}
              onChange={handleDisplayUISettingsBarToggle}
            />
          }
          sx={{ marginLeft: "-8px" }}
          label={<Typography variant="caption">Show UI Settings Bar</Typography>}
        />
      </FormGroup>
    </Stack>
  );

  return (
    <Dialog fullScreen sx={{ width: 240 }} open={open} onClose={onClose}>
      <DialogTitle
        sx={{
          textAlign: showWindowControls ? "left" : "right",
          py: showWindowControls ? 2 : 1.5,
        }}
      >
        UI Display Settings
      </DialogTitle>
      <DialogContent>
        <DialogContentText>Other</DialogContentText>
        {otherSettings}
        <Stack my={1}>
          <Typography
            variant="caption"
            color="text.secondary"
            textAlign="center"
          >
            v{window.kenku.version}
          </Typography>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Done</Button>
      </DialogActions>
    </Dialog>
  );
}
