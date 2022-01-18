import { Sensor } from "./Sensor";

export enum BatteryState {
  "OK" = "OK",
  "LOW" = "LOW",
  "CRITICAL" = "CRITICAL",
}
export enum MemoryState {
  "OK" = "OK",
  "LOW" = "LOW",
  "CRITICAL" = "CRITICAL",
}
export type Phone = {
  battery_level: number; // 93
  battery_state: BatteryState;
  device_id: string; // "1ab5d784b5eae33a"
  device_name: string; // "OnePlus8"
  ip: string; // "192.168.1.21"
  memory: number; // 101001773056
  memory_state: MemoryState;
  sensors?: Sensor[];
};
