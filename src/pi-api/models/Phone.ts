/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type Phone = {
  ip: string;
  port: number;
  device_id: string;
  device_name: string;
  battery_level: number;
  battery_state?: Phone.battery_state;
  memory: number;
  memory_state: Phone.memory_state;
};

export namespace Phone {
  export enum battery_state {
    OK = "OK",
    LOW = "LOW",
    CRITICAL = "CRITICAL",
  }

  export enum memory_state {
    OK = "OK",
    LOW = "LOW",
    CRITICAL = "CRITICAL",
  }
}
