/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { Envelope } from "./Envelope";
import type { Status } from "./Status";

export type StatusEnvelope = Omit<Envelope, "result"> & {
  result: Array<Status>;
};
