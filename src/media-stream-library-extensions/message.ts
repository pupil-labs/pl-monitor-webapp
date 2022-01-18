import { MessageType } from "media-stream-library";

export interface GenericMessage {
  readonly type: MessageType | CustomMessageType;
  readonly data: Buffer;
  ntpTimestamp?: number;
}

export enum CustomMessageType {
  GAZE,
}

export interface GazeRtpMessage extends GenericMessage {
  readonly type: CustomMessageType.GAZE;
  readonly payloadType: number;
  readonly gazePoint: {
    x: number;
    y: number;
    worn: number;
  };
}

export declare type CustomMessage = GazeRtpMessage;
