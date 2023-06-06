import { Format } from "./formats";

export const FORMAT_SUPPORTS_AUDIO: Record<Format, boolean> = {
  RTP_H264: true,
  RTP_JPEG: false,
  MP4_H264: true,
  JPEG: false,
};

export const PI_WORLD_VIDEO_WIDTH = 1088;
export const PI_WORLD_VIDEO_HEIGHT = 1080;

export const DEFAULT_GAZE_CIRCLE_PERCENT = {
  NEON: 3.5,
  INVISIBLE: 8,
};
