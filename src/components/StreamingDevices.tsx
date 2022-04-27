import React, { useCallback } from "react";
import styled from "styled-components";
import { monitorSlice, PiHost } from "../slices/monitorSlice";
import CloseIcon from "@mui/icons-material/Close";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../store";
import { WorldCameraIcon } from "./Icon";
import { EyeCameraIcon } from "./Icon";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import { BatteryIcon } from "./Battery";
import * as piapi from "../pi-api";
import { isDevelopmentServer } from "../App";
interface StreamingDevicesProps {
  readonly toggleView: () => void;
}

export const StreamingDevices: React.FC<StreamingDevicesProps> = ({
  toggleView,
}) => {
  const devices = useSelector((state: RootState) => {
    return state.monitor.devices;
  });

  const dispatch = useDispatch();
  const toggleDevice = useCallback(
    (device) => {
      dispatch(monitorSlice.actions.showDevicePlayer(device.hostId));
    },
    [dispatch],
  );
  const handleDeviceClick = (device: PiHost) => {
    const isDevServer = isDevelopmentServer();
    const deviceApiUrl = new URL(device.apiUrl);

    if (isDevServer) {
      const openInSameTab = true;
      if (openInSameTab) {
        // switch to device in current tab
        toggleDevice(device);
        toggleView();
      } else {
        // load device in new tab on current host
        const externalUrl = new URL(window.location.href);
        externalUrl.search = `?host=${deviceApiUrl.host}`;
        window.open(`${externalUrl}`, "_blank");
      }
    } else {
      // load device in new tab on device host
      deviceApiUrl.pathname = `/`;
      window.open(`${deviceApiUrl}`, "_blank");
    }
  };

  const devicesInMenu: PiHost[] = [];
  for (const device of Object.values(devices)) {
    if (!device.phone) {
      continue;
    }
    if (!device.isServingWebapp) {
      devicesInMenu.push(device);
    }
  }
  return (
    <StreamingContainer>
      <StreamingHeader>
        <CloseButton onClick={toggleView}>
          <CloseIcon />
        </CloseButton>
        <div>Streaming Devices</div>
      </StreamingHeader>
      <DevicesContainer>
        {devicesInMenu.length ? (
          devicesInMenu.map((device) => {
            return (
              <div key={device.hostId}>
                <Devices>
                  <div>
                    <div>
                      <span style={{ lineHeight: 1 }}>
                        <span
                          style={{
                            color:
                              device.current_recording?.action ===
                              piapi.Recording.action.START
                                ? "red"
                                : "",
                          }}
                        >
                          <FiberManualRecordIcon
                            sx={{ verticalAlign: "middle", fontSize: "1em" }}
                          />
                        </span>
                        {device.phone ? (
                          <span>
                            <EyeCameraIcon device={device} />
                            <WorldCameraIcon device={device} />
                            <span>
                              <BatteryIcon
                                size="1em"
                                percent={device.phone.battery_level}
                              />
                            </span>
                          </span>
                        ) : null}
                      </span>
                      <span style={{ paddingLeft: 5 }}>
                        {device.phone ? device.phone.device_name : "unknown"}
                      </span>
                    </div>
                    <DeviceInfo>
                      Phone IP: {device.phone ? device.phone.ip : device.hostId}
                    </DeviceInfo>
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
          })
        ) : (
          <p>There are currently no other devices connected</p>
        )}
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
