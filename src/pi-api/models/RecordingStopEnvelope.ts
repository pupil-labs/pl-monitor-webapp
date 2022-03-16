/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { Envelope } from "./Envelope";
import type { RecordingStop } from "./RecordingStop";

export type RecordingStopEnvelope = Omit<Envelope, "result"> & {
  result: RecordingStop;
};
