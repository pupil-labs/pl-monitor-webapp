import React, { useCallback } from "react";
import styled from "styled-components";
import { monitorSlice } from "../slices/monitorSlice";
import CloseIcon from "@mui/icons-material/Close";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../store";
import VisibilityIcon from "@mui/icons-material/Visibility";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import { BatteryIcon } from "./Battery";
import { deepPurple, teal } from "@mui/material/colors";
import * as piapi from "../pi-api";
interface StreamingDevicesProps {
  readonly toggleView: () => void;
}
const WorldCameraIcon = VisibilityIcon;
const EyeCameraIcon = CameraAltIcon;

export const StreamingDevices: React.FC<StreamingDevicesProps> = ({
  toggleView,
}) => {
  const devices = useSelector((state: RootState) => {
    return state.monitor.devices;
  });

  const dispatch = useDispatch();
  const toggleDevice = useCallback(
    (device) => {
      dispatch(monitorSlice.actions.showDevicePlayer(device.ip));
    },
    [dispatch]
  );
  const handleDeviceClick = (device: any) => {
    if (0) {
      // TODO(dan): for when port is available in NetworkDevice model
      window.open(`http://${device.ip}:${device.port}/`, "_blank");
    } else {
      toggleDevice(device);
      toggleView();
    }
  };

  return (
    <StreamingContainer>
      <StreamingHeader>
        <CloseButton onClick={toggleView}>
          <CloseIcon />
        </CloseButton>
        <div>Streaming Devices</div>
      </StreamingHeader>
      <DevicesContainer>
        {Object.values(devices).map((device) => {
          return (
            <div key={device.ip}>
              <Devices>
                <div>
                  <div>
                    <span style={{ lineHeight: 1, verticalAlign: "middle" }}>
                      <span
                        style={{
                          color:
                            device.current_recording?.action ===
                            piapi.Recording.action.START
                              ? "red"
                              : "",
                        }}
                      >
                        <FiberManualRecordIcon sx={{ fontSize: "1em" }} />
                      </span>
                      <span
                        style={{
                          color: device.gazeSensor?.connected
                            ? deepPurple["A200"]
                            : "gray",
                        }}
                      >
                        <EyeCameraIcon sx={{ fontSize: "1em" }} />
                      </span>
                      <span
                        style={{
                          color: device.worldSensor?.connected
                            ? teal["A700"]
                            : "gray",
                        }}
                      >
                        <WorldCameraIcon sx={{ fontSize: "1em" }} />
                      </span>
                      <span>
                        {device.phone ? (
                          <BatteryIcon
                            size="1em"
                            percent={device.phone.battery_level}
                          />
                        ) : null}
                      </span>
                    </span>
                    {device.phone ? device.phone.device_name : "unknown"}
                  </div>
                  <DeviceInfo>Phone IP: {device.ip}</DeviceInfo>
                </div>
                {device.online ? (
                  <OutboundLink
                    aria-label="connect"
                    onClick={() => handleDeviceClick(device)}
                  >
                    <OpenInNewIcon />
                  </OutboundLink>
                ) : null}
              </Devices>
              <Divider />
            </div>
          );
        })}
      </DevicesContainer>
    </StreamingContainer>
  );
};

const StreamingContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #10181c;
`;

const StreamingHeader = styled.div`
  display: flex;
  gap: 16px;
  align-items: center;
  background-color: #263238;
  height: 56px;
  padding: 0 24px;
`;

const CloseButton = styled.button`
  border-radius: 50%;
  width: 40px;
  height: 40px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  background-color: #263238;
`;

const DevicesContainer = styled.div`
  display: grid;
  max-width: 800px;
  margin: 0 auto;
  padding: 0 24px;
`;

const Devices = styled.div`
  display: grid;
  grid-template-columns: 1fr 40px;
  height: 72px;
  align-items: center;
`;

const DeviceInfo = styled.div`
  font-size: 14px;
  color: #90a4ae;
`;

const OutboundLink = styled.button`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  width: 40px;
`;

const Divider = styled.div`
  width: 100%;
  height: 1px;
  background-color: #263238;
`;
