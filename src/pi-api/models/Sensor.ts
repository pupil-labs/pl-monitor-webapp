/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type Sensor = {
  sensor: Sensor.sensor;
  conn_type: Sensor.conn_type;
  protocol: string;
  ip: string;
  port: number;
  params: string;
  connected: boolean;
};

export namespace Sensor {
  export enum sensor {
    WORLD = "world",
    GAZE = "gaze",
  }

  export enum conn_type {
    DIRECT = "DIRECT",
    WEBSOCKET = "WEBSOCKET",
  }
}
