/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { Envelope } from "./Envelope";
import type { RecordingStart } from "./RecordingStart";

export type RecordingStartEnvelope = Omit<Envelope, "result"> & {
  result: RecordingStart;
};
