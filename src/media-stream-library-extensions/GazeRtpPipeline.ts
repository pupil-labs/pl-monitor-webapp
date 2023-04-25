import { RtspConfig, RtspPipeline, Sink, WSSource } from "media-stream-library";
// } from "media-stream-library/dist/esm/index.browser";
import debug from "debug";
import { GazeDepay } from "./GazeDepay";
import { CustomMessageType, GazeRtpMessage } from "./message";

const debugLog = debug("pl:gaze-depay");

// Default configuration for event stream
const DEFAULT_RTSP_PARAMETERS = {
  parameters: ["audio=0", "video=0", "event=on", "ptz=all"],
};

export interface WSConfig {
  host?: string;
  scheme?: string;
  uri?: string;
  tokenUri?: string;
  protocol?: string;
  timeout?: number;
}

export interface GazeRtpConfig {
  ws?: WSConfig;
  rtsp?: RtspConfig;
  gazeHandler: (msg: GazeRtpMessage) => void;
}

/*
 * GazeRTPPipeline
 *
 * A pipeline that connects to an RTSP server over a WebSocket connection and
 * can process RTP data and calls a handler to process the RTP messages and yields GazeRtpMessages.
 *
 * Handlers that can be set on the pipeline:
 * - all handlers inherited from the RtspPipeline
 * - `onServerClose`: called when the WebSocket server closes the connection
 *   (only then, not when the connection is closed in a different way)
 *
 */
export class GazeRtpPipeline extends RtspPipeline {
  public onServerClose?: () => void;
  public ready: Promise<void>;

  private _src?: WSSource;

  constructor(config: GazeRtpConfig) {
    const { ws: wsConfig, rtsp: rtspConfig, gazeHandler } = config;

    super(Object.assign({}, DEFAULT_RTSP_PARAMETERS, rtspConfig));

    const gazeDepay = new GazeDepay();
    this.append(gazeDepay);
    const handlerSink = Sink.fromHandler((msg: any) => {
      if (msg.type === CustomMessageType.GAZE) {
        gazeHandler(msg);
      }
    });
    this.append(handlerSink);

    const waitForWs = WSSource.open(wsConfig);
    this.ready = waitForWs.then((wsSource) => {
      debugLog("gaze ws ready");
      wsSource.onServerClose = () => {
        debugLog("close connection onServerClose");
        this.onServerClose && this.onServerClose();
      };
      this.prepend(wsSource);
      this._src = wsSource;
    });
  }

  close() {
    this._src && this._src.outgoing.end();
  }
}
