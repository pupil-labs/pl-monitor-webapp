import React, { useState, useEffect, useRef } from "react";
import debug from "debug";
import { utils } from "media-stream-library";
import { GazeRtpPipeline } from "../media-stream-library-extensions/GazeRtpPipeline";
import { Sensor } from "../pi-api";
import * as constants from "./constants";
import { Protocol } from "./protocols";

export interface ScheduledMessage {
  readonly ntpTimestamp: number | undefined;
  readonly data: unknown;
}
const debugLog = debug("msp:ws-rtsp-application");

/**
 * WebSocket + RTP playback component.
 */

interface GazeCircleProps {
  readonly forwardedRef?: React.Ref<HTMLCanvasElement>;
  /**
   * The source URI for the WebSocket server.
   */
  readonly sensor: Sensor;
  readonly customParams?: string;
  readonly secure?: boolean;
  readonly delay: number;
  readonly color: { r: number; g: number; b: number };
  readonly alpha: number;
  readonly size: number;
}

const wsUri = (protocol: Protocol.WS | Protocol.WSS, host: string) => {
  return host.length !== 0 ? `${protocol}//${host}/` : "";
};
const rtspUri = (host: string, customParams?: string) => {
  if (host.length === 0) {
    return "";
  }
  var uri = `rtsp://${host}`;
  if (customParams && customParams.length > 0) {
    uri += `?${customParams}`;
  }
  return uri;
};

const RGBToHex = (r: number, g: number, b: number) => {
  var rStr = r.toString(16);
  var gStr = g.toString(16);
  var bStr = b.toString(16);

  // Prepend 0s, if necessary
  if (rStr.length === 1) rStr = "0" + rStr;
  if (gStr.length === 1) gStr = "0" + gStr;
  if (bStr.length === 1) bStr = "0" + bStr;

  return "#" + rStr + gStr + bStr;
};

interface GazeOverlayProps {
  readonly sensor: Sensor;
}
export const GazeOverlay: React.FC<GazeOverlayProps> = ({ sensor }, ref) => {
  const [gazeDelay] = React.useState(0.0);
  const [gazeColor, setGazeColor] = React.useState({
    r: 200,
    g: 40,
    b: 40,
  });
  const [gazeOpacity, setGazeOpacity] = React.useState(0.8);
  const [gazeRadius, setGazeRadius] = React.useState(80);
  const [gazeStrokeWidth, setStrokeWidth] = React.useState(40);

  const [gazeHost, setGazeHost] = React.useState("");
  const [gazeSearchParams, setGazeSearchParams] = React.useState("");
  const [gazePosition, setGazePosition] = React.useState({
    x_norm: 0,
    y_norm: 0,
  });

  useEffect(() => {
    if (sensor && sensor.connected) {
      setGazeHost(`${sensor.ip}:${sensor.port}`);
      setGazeSearchParams(sensor.params);
    } else {
      setGazeHost("");
      setGazeSearchParams("");
    }
  }, [sensor]);

  const delay = 0;
  const videoWidth = constants.PI_WORLD_VIDEO_HEIGHT;
  const videoHeight = constants.PI_WORLD_VIDEO_WIDTH;
  const [pipeline, setPipeline] = useState<null | GazeRtpPipeline>(null);

  const secure = false;
  const customParams = "camera=gaze";
  useEffect(() => {
    const host = `${sensor.ip}:${sensor.port}`;
    const params = sensor.params;
    const ws = wsUri(secure ? Protocol.WSS : Protocol.WS, host);
    const rtsp = rtspUri(host, customParams);
    if (
      ws !== undefined &&
      ws.length > 0 &&
      rtsp !== undefined &&
      rtsp.length > 0
    ) {
      const newPipeline = new GazeRtpPipeline({
        ws: { uri: ws },
        rtsp: { uri: rtsp },
        gazeHandler: (msg) => {
          if (msg) {
            console.log();
            if (msg.gazePoint.worn) {
              setGazePosition({
                x_norm: msg.gazePoint.x / videoWidth,
                y_norm: msg.gazePoint.y / videoHeight,
              });
            } else {
              setGazePosition({ x_norm: -0.1, y_norm: -0.1 });
            }
          }
        },
      });
      setPipeline(newPipeline);

      let scheduler: utils.Scheduler<ScheduledMessage> | undefined;

      return () => {
        console.log("close pipeline and clear video");
        newPipeline.close();
        // metadataEl.src = ''
        scheduler?.reset();
        setPipeline(null);
      };
    }
  }, [sensor]);

  useEffect(() => {
    if (pipeline) {
      pipeline.rtsp.play();
    }
  }, [pipeline]);

  return (
    <svg width="100%" height="100%">
      <circle
        r="8%"
        stroke={RGBToHex(gazeColor.r, gazeColor.g, gazeColor.b)}
        opacity={gazeOpacity}
        cx={`${gazePosition.x_norm * 100}%`}
        cy={`${gazePosition.y_norm * 100}%`}
        strokeWidth="2%"
        fill="None"
      />
    </svg>
  );
};
export default GazeOverlay;
