import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import * as piapi from "../pi-api";
import { RecordingAction } from "../pi-api";

type IPAddress = string;
export type Phone = {
  battery_level: number; // 93
  //   battery_state: BatteryState;
  device_id: string; // "1ab5d784b5eae33a"
  device_name: string; // "OnePlus8"
  ip: IPAddress; // "192.168.1.21"
  memory: number; // 101001773056
  //   memory_state: MemoryState;
};

export enum ConnectionState {
  DISCONNECTED = "disconnected",
  CONNECTED = "connected",
  CONNECTING = "connecting",
  UNKNOWN = "unknown",
}
export type Event = {
  name: string;
  timestamp: number;
};

export type Recording = {
  id: string;
  rec_duration_ns: number;
  action: piapi.RecordingAction;
  events: Event[];
};

// export enum SensorKind {
//   WORLD,
//   GAZE,
// }
// export enum BatteryState {
//   OK,
//   LOW,
//   CRITICAL,
// }
// export enum StorageState {
//   OK,
//   LOW,
//   CRITICAL,
// }
// export interface PiHost {
//   device_id: string; // "1ab5d784b5eae33a"
//   device_name: string; // "OnePlus8"
//   ip: string; // "192.168.1.21"
//   battery_level: number; // 93
//   battery_state: BatteryState;
//   storage_available_bytes: number; // 101001773056
//   storage_state: StorageState;
//   sensors: Sensor[];
//   gazeSensor?: GazeSensor;
//   worldSensor?: WorldSensor;
// }

export type PiHost = {
  ip: IPAddress;
  is_dummy?: boolean;
  state: ConnectionState;
  online: boolean;
  current_recording?: Recording;
  sensors: {
    [key: string]: piapi.Sensor;
  };
  phone?: Phone;
  showPlayer?: boolean;
  hardware?: piapi.Hardware;
  worldSensor?: piapi.Sensor;
  gazeSensor?: piapi.Sensor;
};

// type EventMenuEntry = {
//   name: string;
//   hotkey: string;
// };

// Define a type for the slice state
interface MonitorState {
  devices: {
    [key: string]: PiHost;
  };
  activeDevice?: PiHost;
  presetEvents: string[];
  messages: string[];
}

// Define the initial state using that type
const initialState: MonitorState = {
  presetEvents: ["Event 1", "Event 2", "Event 3", "Event 4", "Event 5"],
  messages: ["Snackbar"],
  devices: {
    "192.168.1.1": {
      showPlayer: true,
      is_dummy: true,
      online: true,
      state: ConnectionState.DISCONNECTED,
      ip: "192.168.1.1",
      phone: {
        battery_level: 60,
        device_id: "1235",
        device_name: "Dummy Device",
        ip: "192.168.1.1",
        memory: 12351251235,
      },
      current_recording: {
        id: "1234-1234-1243-1243",
        rec_duration_ns: 26045344000000,
        action: piapi.RecordingAction.START,
        events: [
          { name: "dummy event 1", timestamp: 1643793833051380528 },
          { name: "dummy event 2", timestamp: 1643793833051380528 },
        ],
      },
      sensors: {},
    },
  },
};

type PhoneConnectionStateAction = {
  ip: IPAddress;
  state: ConnectionState;
};

type HardwareStatusPayload = {
  ip: IPAddress;
  hardware: piapi.Hardware;
};

type RecordingStatusPayload = {
  ip: IPAddress;
  recording: piapi.Recording;
};

type EventPayload = {
  name: string;
  index: number;
}

export const monitorSlice = createSlice({
  name: "phone",
  initialState,
  reducers: {
    showDevicePlayer: (state, action: PayloadAction<IPAddress>) => {
      for (const ip in state.devices) {
        state.devices[ip].showPlayer = ip === action.payload;
      }
    },
    phoneStateReceived: (state, action: PayloadAction<Phone>) => {
      const phone = action.payload;
      state.devices[phone.ip].phone = phone;
    },
    recordingMessageReceived: (state, action: PayloadAction<string>) => {
      const message = action.payload;
      state.messages.push(message);
    },
    phoneConnectionStateChanged: (
      state,
      action: PayloadAction<PhoneConnectionStateAction>
    ) => {
      const device = state.devices[action.payload.ip];
      if (!device.is_dummy) {
        device.online = action.payload.state === ConnectionState.CONNECTED;
      }
      device.state = action.payload.state;
    },
    recordingStatusReceived: (
      state,
      action: PayloadAction<RecordingStatusPayload>
    ) => {
      const { ip, recording } = action.payload;
      const previousRecordingState = state.devices[ip].current_recording;

      let events = previousRecordingState ? previousRecordingState.events : [];
      if (recording.action === RecordingAction.START) {
        events = [];
      }
      state.devices[ip].current_recording = {
        ...recording,
        events: events,
      };
    },
    deviceDetected: (state, action: PayloadAction<IPAddress>) => {
      const ip = action.payload;
      if (!state.devices[ip]) {
        state.devices[ip] = {
          ip: ip,
          online: false,
          state: ConnectionState.DISCONNECTED,
          phone: undefined,
          sensors: {},
          showPlayer: Object.values(state.devices).length < 1,
        };
      }
    },
    sensorStatusReceived: (state, action: PayloadAction<piapi.Sensor>) => {
      const sensor = action.payload;
      const sensorKey = `${sensor.sensor}-${sensor.conn_type}`;
      const device = state.devices[sensor.ip];
      device.sensors[sensorKey] = sensor;
      if (sensor.conn_type === piapi.ConnectionType.WEBSOCKET) {
        if (sensor.sensor === piapi.SensorName.GAZE) {
          device.gazeSensor = sensor;
        }
        if (sensor.sensor === piapi.SensorName.WORLD) {
          device.worldSensor = sensor;
        }
      }
    },
    hardwareStatusReceived: (
      state,
      action: PayloadAction<HardwareStatusPayload>
    ) => {
      const { ip, hardware } = action.payload;
      state.devices[ip].hardware = hardware;
    },
    addCustomPresetEvent: (state, action: PayloadAction<string>) => {
      const eventName = action.payload;
      state.presetEvents.push(eventName);
    },
    removeCustomPresetEvent: (state, action: PayloadAction<number>) => {
      const index = action.payload;
      if (index === state.presetEvents.length - 1) {
        state.presetEvents.pop();
      } else {
        state.presetEvents[index] = "";
      }
    },
    editPresetEvent: (state, action: PayloadAction<EventPayload>) => {
      const event = action.payload;
      state.presetEvents[event.index] = event.name;
    },
  },
});

export const { actions } = monitorSlice;
export const selectDevices = (state: RootState) => state.monitor.devices;

export default monitorSlice.reducer;
