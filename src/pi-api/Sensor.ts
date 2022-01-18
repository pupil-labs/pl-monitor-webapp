export enum ConnectionType {
  "WEBSOCKET" = "WEBSOCKET",
  "DIRECT" = "DIRECT",
}
export enum SensorName {
  "WORLD" = "world",
  "GAZE" = "gaze",
}
export type Sensor = {
  conn_type: ConnectionType;
  ip: string;
  port: number;
  connected: boolean;
  params: string;
  sensor: SensorName;
};
