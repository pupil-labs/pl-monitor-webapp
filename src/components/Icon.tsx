import { deepPurple, teal } from "@mui/material/colors";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import { PiHost } from "../slices/monitorSlice";

export type EyeCameraIconProps = {
  device?: PiHost;
};

export const EyeCameraIcon: React.FC<EyeCameraIconProps> = ({ device }) => {
  return (
    <span
      style={{
        verticalAlign: "bottom",
        color: device?.gazeSensor?.connected ? teal["A700"] : "gray",
      }}
    >
      <VisibilityIcon sx={{ fontSize: "1em" }} />
    </span>
  );
};

export type WorldCameraIconProps = {
  device?: PiHost;
};

export const WorldCameraIcon: React.FC<WorldCameraIconProps> = ({ device }) => {
  return (
    <span
      style={{
        verticalAlign: "bottom",
        color: device?.worldSensor?.connected ? deepPurple["A200"] : "gray",
      }}
    >
      <CameraAltIcon sx={{ fontSize: "1em" }} />
    </span>
  );
};
