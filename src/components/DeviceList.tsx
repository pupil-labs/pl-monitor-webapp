import { useCallback } from "react";

import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import ListSubheader from "@mui/material/ListSubheader";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import PhonelinkRingIcon from "@mui/icons-material/PhonelinkRing";
import { BatteryIcon } from "./Battery";
import { monitorSlice, PiHost } from "../slices/monitorSlice";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import styled from "styled-components";
import { deepPurple, teal } from "@mui/material/colors";
import { useDispatch } from "react-redux";

export type DeviceListProps = {
  piHosts: {
    [key: string]: PiHost;
  };
};

export const DeviceList = (props: DeviceListProps) => {
  const dispatch = useDispatch();
  const toggleDevice = useCallback((device) => {
    dispatch(monitorSlice.actions.showDevicePlayer(device.ip));
  }, []);
  return (
    <List
      sx={{ width: "100%", maxWidth: 360, bgcolor: "background.paper" }}
      subheader={<ListSubheader>Pupil Invisible Hosts</ListSubheader>}
    >
      {Object.entries(props.piHosts).map(([piHostIp, piHost]) => {
        if (!piHost.online) {
          return null;
        }
        return (
          <ListItem
            key={piHost.ip}
            secondaryAction={
              <IconButton
                onClick={() => toggleDevice(piHost)}
                edge="end"
                aria-label="connect"
              >
                <PhonelinkRingIcon />
              </IconButton>
            }
          >
            <ListItemAvatar>
              <Avatar>
                <VisibilityIcon />
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              id="switch-list-label-wifi"
              primary={piHost.phone ? piHost.phone.device_name : "unknown"}
              secondary={
                <>
                  <span>{piHost.ip}</span>
                  {piHost.phone ? (
                    <BatteryIcon percent={piHost.phone.battery_level} />
                  ) : null}
                  <span
                    style={{
                      color: piHost.worldSensor?.connected
                        ? deepPurple["A200"]
                        : "gray",
                    }}
                  >
                    <WorldCameraIcon />
                  </span>
                  <span
                    style={{
                      color: piHost.gazeSensor?.connected
                        ? teal["A700"]
                        : "gray",
                    }}
                  >
                    <EyeCameraIcon />
                  </span>
                </>
              }
            />
          </ListItem>
        );
      })}
    </List>
  );
};

const WorldCameraIcon = VisibilityIcon;
const EyeCameraIcon = CameraAltIcon;

// const WorldCameraOn = styled.VisibilityIcon`
// color: red;
// `
// const EyeCameraOn = styled.label`
// color: red;
// `
