import { debug } from "debug";
import { utils } from "media-stream-library";
import React, { useEffect, useState } from "react";
import { GazeRtpPipeline } from "../media-stream-library-extensions/GazeRtpPipeline";
import { Sensor } from "../pi-api";
import { Resolution } from "./Player";
import { Protocol } from "./protocols";

const debugLog = debug("pl:gaze-overlay");

// type BaseElement = SVGCircleElement
// type BaseProps = Omit<SVGProps<BaseElement>, 'ref'>
export interface ScheduledMessage {
  readonly ntpTimestamp: number | undefined;
  readonly data: unknown;
}

/**
 * WebSocket + RTP playback component.
 */

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
  readonly gazeRadiusPercent: number;
  readonly sensor: Sensor;
  readonly resolution: Resolution;
}
export const GazeOverlay: React.FC<GazeOverlayProps> = (
  { gazeRadiusPercent, sensor, resolution },
  ref,
) => {
  const gazeColor = {
    r: 200,
    g: 40,
    b: 40,
  };
  let gazeStrokeRadiusPercent = Math.min(gazeRadiusPercent / 6);

  const gazeRadius = `${gazeRadiusPercent / 2}%`;
  const gazeStrokeWidth = `${gazeStrokeRadiusPercent}%`;
  let gazeOpacity = 0.8;
  if (gazeRadiusPercent < 3) {
    gazeOpacity = 1;
  }
  gazeOpacity = 1;

  const [gazePosition, setGazePosition] = React.useState({
    x_norm: 0,
    y_norm: 0,
  });

  const [pipeline, setPipeline] = useState<null | GazeRtpPipeline>(null);

  const customParams = "camera=gaze";
  useEffect(() => {
    const secure = false;
    const host = `${sensor.ip}:${sensor.port}`;
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
                x_norm: msg.gazePoint.x / resolution.width,
                y_norm: msg.gazePoint.y / resolution.height,
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
        debugLog("close gaze pipeline and clear video");
        newPipeline.close();
        // metadataEl.src = ''
        scheduler?.reset();
        setPipeline(null);
      };
    }
  }, [sensor, resolution]);

  useEffect(() => {
    if (pipeline) {
      pipeline.rtsp.play();
    }
  }, [pipeline]);

  const gazePositionCx = Math.max(0, Math.min(gazePosition.x_norm, 1)) * 100;
  const gazePositionCy = Math.max(0, Math.min(gazePosition.y_norm, 1)) * 100;

  return (
    <svg width="100%" height="100%">
      <circle
        r={gazeRadius}
        stroke={RGBToHex(gazeColor.r, gazeColor.g, gazeColor.b)}
        opacity={gazeOpacity}
        cx={`${gazePositionCx}%`}
        cy={`${gazePositionCy}%`}
        strokeWidth={gazeStrokeWidth}
        fill="None"
      />
    </svg>
  );
};
export default GazeOverlay;
