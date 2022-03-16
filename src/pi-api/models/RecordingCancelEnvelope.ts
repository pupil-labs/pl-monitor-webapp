/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { Envelope } from "./Envelope";
import type { RecordingCancel } from "./RecordingCancel";

export type RecordingCancelEnvelope = Omit<Envelope, "result"> & {
  result: RecordingCancel;
};
