import React, { useCallback } from "react";
import styled from "styled-components";
import CloseIcon from "@mui/icons-material/Close";
import * as monitorSlice from "../slices/monitorSlice";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../store";

interface SettingsProps {
  readonly isOpen: boolean;
  readonly device: monitorSlice.PiHost;
  readonly toggleSettings: () => void;
}

const formatBytes = (bytes: number | undefined, decimals: number) => {
  if (bytes === 0 || bytes === undefined) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

export const Settings: React.FC<SettingsProps> = ({
  isOpen,
  device,
  toggleSettings,
}) => {
  const dispatch = useDispatch();

  const onShowSettings = useCallback(() => {
    if (isOpen) {
      toggleSettings();
    }
  }, [isOpen, toggleSettings]);

  const presetEvents = useSelector((state: RootState) => {
    return state.monitor.presetEvents.slice(0, 7);
  });
  const eventMenu: string[] = [];
  presetEvents.map((x) => {
    eventMenu.push(x);
  });
  eventMenu.push("");

  const onEventnameChange = useCallback(
    (e, index) => {
      const newVal = {
        name: e.target.value,
        index: index,
      };
      dispatch(monitorSlice.actions.editPresetEvent(newVal));
    },
    [dispatch]
  );

  return (
    <>
      <SettingsContainer>
        <SettingsHeader>
          <CloseButton onClick={onShowSettings}>
            <CloseIcon />
          </CloseButton>
          <div>Settings</div>
        </SettingsHeader>
        <ControlsContainer>
          <div>
            <div style={{ padding: "16px 0" }}>Device Information</div>
            <PhoneContainer>
              <div>
                <span>Phone Name: </span>
                <span>{device.phone?.device_name}</span>
              </div>
              <div>
                <span>Phone Battery Level: </span>
                <span>{device.phone?.battery_level}%</span>
              </div>
              <div>
                <span>Phone ID: </span>
                <span>{device.phone?.device_id}</span>
              </div>
              <div>
                <span>Phone IP: </span>
                <span>{device.phone?.ip}</span>
              </div>
              <div>
                <span>Phone Memory: </span>
                <span>{formatBytes(device.phone?.memory, 2)}</span>
              </div>
            </PhoneContainer>
          </div>
          <Divider />
          <div>
            <div>Event Hotkey Settings</div>
          </div>
          <HotkeyContainer>
            {eventMenu.map((eventName, index) => (
              <HotkeyRow key={index}>
                <HotkeyIndex>{(index + 1).toString()}</HotkeyIndex>
                <HotkeyInput
                  type="text"
                  name="hotkeystring"
                  placeholder={eventName || "New Event"}
                  defaultValue={eventName}
                  onChange={(e) => onEventnameChange(e, index)}
                />
              </HotkeyRow>
            ))}
          </HotkeyContainer>
        </ControlsContainer>
      </SettingsContainer>
    </>
  );
};

const SettingsContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #10181c;
`;

const SettingsHeader = styled.div`
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

const ControlsContainer = styled.div`
  display: grid;
  gap: 20px;
  max-width: 800px;
  margin: 0 auto;
  padding: 0 24px;
`;

const HotkeyContainer = styled.div`
  display: grid;
  gap: 16px;
`;

const HotkeyRow = styled.div`
  display: grid;
  grid-template-columns: 20px auto;
  gap: 8px;
`;

const Divider = styled.div`
  width: 100%;
  height: 1px;
  background-color: #263238;
`;

const PhoneContainer = styled.div`
  font-size: 14px;
`;

const HotkeyIndex = styled.span`
  line-height: 1;
`;

const HotkeyInput = styled.input`
  background-color: #263238;
  border: none;
  height: 48px;
  margin: 0;
  padding: 16px;
  ::placeholder {
    transform: translateY(-2px);
    font-size: 14px;
    color: #90a4ae;
    opacity: 1;
  }
  ::-ms-input-placeholder {
    font-size: 14px;
    color: #90a4ae;
  }
`;
