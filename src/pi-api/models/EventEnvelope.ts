/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { Envelope } from "./Envelope";
import type { Event } from "./Event";

export type EventEnvelope = Omit<Envelope, "result"> & {
  result: Event;
};
