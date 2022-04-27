import React, { Ref } from "react";
import {
  Sdp,
  Html5VideoPipeline,
  Html5CanvasPipeline,
  HttpMsePipeline,
  TransformationMatrix,
  Rtcp,
} from "media-stream-library";
import debug from "debug";

import { WsRtspVideo } from "./WsRtspVideo";
import { WsRtspCanvas } from "./WsRtspCanvas";
import { StillImage } from "./StillImage";
import { MetadataHandler } from "./metadata";
import { HttpMp4Video } from "./HttpMp4Video";
import { Format } from "./formats";

export type PlayerNativeElement =
  | HTMLVideoElement
  | HTMLCanvasElement
  | HTMLImageElement;

export type PlayerPipeline =
  | Html5VideoPipeline
  | Html5CanvasPipeline
  | HttpMsePipeline;

const debugLog = debug("msp:api");

export enum PiApi {
  "PI_SENSOR_STREAM" = "PI_SENSOR_STREAM",
  "PI_UNIMPLEMENTED" = "PI_UNIMPLEMENTED",
}

export enum Protocol {
  "HTTP" = "http:",
  "HTTPS" = "https:",
  "WS" = "ws:",
  "WSS" = "wss:",
}

export const FORMAT_API: Record<Format, PiApi> = {
  RTP_H264: PiApi.PI_SENSOR_STREAM,
  RTP_JPEG: PiApi.PI_SENSOR_STREAM,
  MP4_H264: PiApi.PI_UNIMPLEMENTED,
  JPEG: PiApi.PI_UNIMPLEMENTED,
};

export interface PiApiParameters {
  readonly [key: string]: string;
}

export type Range = readonly [number | undefined, number | undefined];

export interface VideoProperties {
  readonly el: PlayerNativeElement;
  readonly width: number;
  readonly height: number;
  readonly formatSupportsAudio: boolean;
  readonly pipeline?: PlayerPipeline;
  readonly media?: ReadonlyArray<{
    readonly type: "video" | "audio" | "data";
    readonly mime: string;
  }>;
  readonly volume?: number;
  readonly range?: Range;
  readonly sensorTm?: TransformationMatrix;
}

interface PlaybackAreaProps {
  readonly forwardedRef?: Ref<PlayerNativeElement>;
  readonly host: string;
  readonly format: Format;
  readonly parameters?: PiApiParameters;
  readonly play?: boolean;
  readonly offset?: number;
  readonly refresh: number;
  readonly onPlaying: (properties: VideoProperties) => void;
  readonly onEnded?: () => void;
  readonly onSdp?: (msg: Sdp) => void;
  readonly onRtcp?: (msg: Rtcp) => void;
  readonly metadataHandler?: MetadataHandler;
  readonly secure?: boolean;
  /**
   * Activate automatic retries on RTSP errors.
   */
  readonly autoRetry?: boolean;
}

const wsUri = (protocol: Protocol.WS | Protocol.WSS, host: string) => {
  return host.length !== 0 ? `${protocol}//${host}/` : "";
};

const rtspUri = (host: string, searchParams: string) => {
  return host.length !== 0
    ? `rtsp://${host}/axis-media/media.amp?${searchParams}`
    : "";
};

const mediaUri = (
  protocol: Protocol.HTTP | Protocol.HTTPS,
  host: string,
  searchParams: string,
) => {
  return host.length !== 0
    ? `${protocol}//${host}/axis-cgi/media.cgi?${searchParams}`
    : "";
};

const imgUri = (
  protocol: Protocol.HTTP | Protocol.HTTPS,
  host: string,
  searchParams: string,
) => {
  return host.length !== 0
    ? `${protocol}//${host}/axis-cgi/jpg/image.cgi?${searchParams}`
    : "";
};

/**
 * User-specified URI parameters.
 *
 * Note that parameters such as `videocodec` or `container` are automatically
 * set based on the chosen format (since they effect which component to use).
 */
const PARAMETERS: Record<PiApi, ReadonlyArray<string>> = {
  [PiApi.PI_SENSOR_STREAM]: [
    "camera", // "world" | "gaze"
  ],
  [PiApi.PI_UNIMPLEMENTED]: [],
};

/**
 * searchParams
 *
 * Produce a (URI-encoded) search parameter string for use in a URL
 * from a list of key,value pairs. The keys are checked against the
 * known keys for a particular API.
 *
 * @param searchParamList a list of [key, value] pairs
 */
const searchParams = (api: PiApi, parameters: PiApiParameters = {}) => {
  const parameterList = PARAMETERS[api];
  return Object.entries(parameters)
    .map(([key, value]) => {
      if (!parameterList.includes(key)) {
        debugLog(`undocumented API parameter ${key}`);
      }
      return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    })
    .join("&");
};

export const PlaybackArea: React.FC<PlaybackAreaProps> = ({
  forwardedRef,
  host,
  format,
  parameters = {},
  play,
  offset,
  refresh,
  onPlaying,
  onEnded,
  onSdp,
  onRtcp,
  metadataHandler,
  secure = window.location.protocol === Protocol.HTTPS,
  autoRetry = false,
}) => {
  const timestamp = refresh.toString();

  if (host === "dummy") {
    return (
      <StillImage
        key={refresh}
        forwardedRef={forwardedRef as Ref<HTMLImageElement>}
        {...{
          src: `https://dummyimage.com/1088x1080/00454d/0affde.png`,
          play,
          onPlaying,
        }}
      />
    );
  }

  // Use for world/eye h264 streams
  if (format === Format.RTP_H264) {
    const ws = wsUri(secure ? Protocol.WSS : Protocol.WS, host);
    const rtsp = rtspUri(
      host,
      searchParams(FORMAT_API[format], {
        ...parameters,
        timestamp,
        videocodec: "h264",
      }),
    );
    return (
      <WsRtspVideo
        key={refresh}
        forwardedRef={forwardedRef as Ref<HTMLVideoElement>}
        {...{
          ws,
          rtsp,
          play,
          offset,
          onPlaying,
          onEnded,
          onSdp,
          onRtcp,
          metadataHandler,
          autoRetry,
        }}
      />
    );
  }

  // Use for eye MJPEG streams in future, untested
  if (format === Format.RTP_JPEG) {
    const ws = wsUri(secure ? Protocol.WSS : Protocol.WS, host);
    const rtsp = rtspUri(
      host,
      searchParams(FORMAT_API[format], {
        ...parameters,
        timestamp,
        videocodec: "jpeg",
      }),
    );

    return (
      <WsRtspCanvas
        key={refresh}
        forwardedRef={forwardedRef as Ref<HTMLCanvasElement>}
        {...{ ws, rtsp, play, offset, onPlaying, onEnded, onSdp, onRtcp }}
      />
    );
  }

  if (format === Format.JPEG) {
    const src = imgUri(
      secure ? Protocol.HTTPS : Protocol.HTTP,
      host,
      searchParams(FORMAT_API[format], {
        ...parameters,
        timestamp,
      }),
    );

    return (
      <StillImage
        key={refresh}
        forwardedRef={forwardedRef as Ref<HTMLImageElement>}
        {...{ src, play, onPlaying }}
      />
    );
  }

  // NOTE: we may use in future for playing existing recordings from device
  if (format === Format.MP4_H264) {
    const src = mediaUri(
      secure ? Protocol.HTTPS : Protocol.HTTP,
      host,
      searchParams(FORMAT_API[format], {
        ...parameters,
        timestamp,
        videocodec: "h264",
        container: "mp4",
      }),
    );

    return (
      <HttpMp4Video
        key={refresh}
        forwardedRef={forwardedRef as Ref<HTMLVideoElement>}
        {...{ src, play, onPlaying, onEnded }}
      />
    );
  }

  console.warn(`Error: unknown format: ${format},
please use one of ${[
    Format.RTP_H264,
    Format.JPEG,
    Format.MP4_H264,
    Format.RTP_JPEG,
  ].join(", ")}`);

  return null;
};
