/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

import type { Event } from "./Event";
import type { NetworkDevice } from "./NetworkDevice";
import type { Phone } from "./Phone";
import type { Recording } from "./Recording";
import type { Sensor } from "./Sensor";

export type Status = {
  model: string;
  data: Event | Recording | NetworkDevice | Sensor | Phone;
};
