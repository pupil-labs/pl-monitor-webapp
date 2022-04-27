import React, {
  ChangeEventHandler,
  useCallback,
  useRef,
  useState,
} from "react";
import styled from "styled-components";

import { PiApiParameters } from "./PlaybackArea";
import { Switch } from "./Switch";
import { Format } from "./formats";

const SettingsMenuContainer = styled.div`
  font-family: sans-serif;
  display: flex;
  flex-direction: column;
  position: absolute;
  bottom: 32px;
  right: 0;
  background: rgb(0, 0, 0, 0.66);
  padding: 8px 16px;
  margin-bottom: 16px;
  margin-right: 8px;

  &:after {
    content: "";
    width: 10px;
    height: 10px;
    transform: rotate(45deg);
    position: absolute;
    bottom: -5px;
    right: 12px;
    background: rgb(0, 0, 0, 0.66);
  }
`;

const SettingsItem = styled.div`
  display: flex;
  flex-direction: row;
  color: white;
  height: 24px;
  width: 320px;
  align-items: center;
  justify-content: space-between;
  margin: 4px 0;
`;

interface SettingsMenuProps {
  readonly parameters: PiApiParameters;
  readonly format: Format;
  readonly onFormat: (format: Format) => void;
  readonly onPiApix: (key: string, value: string) => void;
  readonly showStatsOverlay: boolean;
  readonly toggleStats: (newValue?: boolean) => void;
}

export const SettingsMenu: React.FC<SettingsMenuProps> = ({
  parameters,
  format,
  onFormat,
  onPiApix,
  showStatsOverlay,
  toggleStats,
}) => {
  const [textString, setTextString] = useState(parameters["textstring"]);
  const textStringTimeout = useRef<number>();

  const changeParam: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      const { name, value } = e.target;

      switch (name) {
        case "textstring":
          setTextString(value);

          clearTimeout(textStringTimeout.current);
          textStringTimeout.current = window.setTimeout(() => {
            onPiApix(name, value);
          }, 300);

          break;

        case "text":
          onPiApix(name, value ? "1" : "0");
          break;
        default:
          console.warn("internal error");
      }
    },
    [onPiApix],
  );

  const changeStatsOverlay: ChangeEventHandler<HTMLInputElement> = useCallback(
    (e) => toggleStats(e.target.checked),
    [toggleStats],
  );

  const changeFormat: ChangeEventHandler<HTMLSelectElement> = useCallback(
    (e) => onFormat(e.target.value as Format),
    [onFormat],
  );

  const changeResolution: ChangeEventHandler<HTMLSelectElement> = useCallback(
    (e) => onPiApix("resolution", e.target.value),
    [onPiApix],
  );

  // FIXME(dan): this is to stop compiler errors about unused vars, we will
  // want to use them, just not now
  if (0) {
    console.log(textString, changeParam, changeResolution);
  }

  return (
    <SettingsMenuContainer>
      <SettingsItem>
        <div>Format</div>
        <select onChange={changeFormat} defaultValue={format}>
          <option value="RTP_H264">H.264 (RTP over WS)</option>
          <option value="MP4_H264">H.264 (MP4 over HTTP)</option>
          <option value="RTP_JPEG">Motion JPEG</option>
          <option value="JPEG">Still image</option>
        </select>
      </SettingsItem>
      {/* <SettingsItem>
        <div>Resolution</div>
        <select value={parameters["resolution"]} onChange={changeResolution}>
          <option value="">default</option>
          <option value="1920x1080">1920 x 1080 (FHD)</option>
          <option value="1280x720">1280 x 720 (HD)</option>
          <option value="800x600">800 x 600 (VGA)</option>
        </select>
      </SettingsItem>
      <SettingsItem>
        <div>Text overlay</div>
        <input name="textstring" value={textString} onChange={changeParam} />
        <Switch
          name="text"
          checked={parameters["text"] === "1"}
          onChange={changeParam}
        />
      </SettingsItem> */}
      <SettingsItem>
        <div>Stats overlay</div>
        <Switch checked={showStatsOverlay} onChange={changeStatsOverlay} />
      </SettingsItem>
    </SettingsMenuContainer>
  );
};
