import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import * as piapi from "../pi-api";
import { Recording } from "../pi-api";

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

export type RecordingWithEvents = Recording & {
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
  current_recording?: RecordingWithEvents;
  sensors: {
    [key: string]: piapi.Sensor;
  };
  lastError: string;
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
  timestamp: number;
}

// Define the initial state using that type
const initialState: MonitorState = {
  presetEvents: ["Event 1", "Event 2", "Event 3", "Event 4", "Event 5"],
  messages: [""],
  devices: {},
  timestamp: 0,
};

if (process.env.NODE_ENV === "development") {
  initialState.devices["1.3.3.7"] = {
    showPlayer: true,
    is_dummy: true,
    online: true,
    state: ConnectionState.DISCONNECTED,
    ip: "1.3.3.7",
    phone: {
      battery_level: 60,
      device_id: "1235",
      device_name: "Dummy Device",
      ip: "1.3.3.7",
      memory: 12351251235,
    },
    lastError: "",
    current_recording: {
      id: "1234-1234-1243-1243",
      rec_duration_ns: 26045344000000,
      action: piapi.Recording.action.STOP,
      message: "",
      events: [
        { name: "dummy event 1", timestamp: 1643793833051380528 },
        { name: "dummy event 2", timestamp: 1643793833051380528 },
      ],
    },
    sensors: {},
  };
}

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

type EditEventPayload = {
  name: string;
  index: number;
};

type DeviceSnackbarMessage = {
  ip: string;
  message: string;
};

interface PiHostApiError {
  ip: string;
  error: string;
}

export const startRecording = createAsyncThunk<
  piapi.RecordingStart,
  string,
  {
    rejectValue: PiHostApiError;
  }
>("recordings/startRecording", async (ip, thunkApi) => {
  const apiClient = new piapi.PIClient({ BASE: `http://${ip}:8080/api` });
  try {
    const response = await apiClient.recording.postRecordingStart();
    return response.result as piapi.RecordingStart;
  } catch (err: any) {
    return thunkApi.rejectWithValue({
      ip: ip,
      error: err.body.message,
    } as PiHostApiError);
  }
});

export const stopAndSaveRecording = createAsyncThunk<
  piapi.RecordingStop,
  string,
  {
    rejectValue: PiHostApiError;
  }
>("recordings/startRecording", async (ip, thunkApi) => {
  const apiClient = new piapi.PIClient({ BASE: `http://${ip}:8080/api` });
  try {
    const response = await apiClient.recording.postRecordingStopAndSave();
    return response.result as piapi.RecordingStop;
  } catch (err: any) {
    return thunkApi.rejectWithValue({
      ip: ip,
      error: err.body.message,
    } as PiHostApiError);
  }
});

interface SaveEventPayload {
  name: string;
  ip: string | undefined;
}

export const saveEvent = createAsyncThunk<
  Event,
  SaveEventPayload,
  {
    rejectValue: PiHostApiError;
  }
>("event/saveEvent", async (event, thunkApi) => {
  const apiClient = new piapi.PIClient({ BASE: `http://${event.ip}:8080/api` });
  try {
    const response = await apiClient.events.postEvent({ name: event.name });
    return response.result as Event;
  } catch (err: any) {
    return thunkApi.rejectWithValue({
      ip: event.ip,
      error: err.body.message,
    } as PiHostApiError);
  }
});

export const monitorSlice = createSlice({
  name: "phone",
  initialState,
  extraReducers: (builder) => {
    builder.addCase(startRecording.fulfilled, (state, action) => {
      state.devices[action.meta.arg].lastError = "";
    });
    builder.addCase(startRecording.rejected, (state, action: any) => {
      let error = "";
      if (action.payload.error) {
        error = `${action.payload.error}`;
      }
      state.devices[action.meta.arg].lastError = error;
    });
  },
  reducers: {
    showDevicePlayer: (state, action: PayloadAction<IPAddress>) => {
      for (const ip in state.devices) {
        state.devices[ip].showPlayer = ip === action.payload;
      }
    },
    phoneStateReceived: (state, action: PayloadAction<Phone>) => {
      const phone = action.payload;
      if (!state.devices[phone.ip]) {
        state.devices[phone.ip] = {
          ip: phone.ip,
          online: true,
          lastError: "",
          state: ConnectionState.DISCONNECTED,
          phone: phone,
          sensors: {},
          showPlayer: Object.values(state.devices).length < 1,
        };
      }
      state.devices[phone.ip].phone = phone;
    },
    setDeviceLastError: (
      state,
      action: PayloadAction<DeviceSnackbarMessage>
    ) => {
      const { ip, message } = action.payload;
      state.devices[ip].lastError = message;
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
      device.lastError = "";
    },
    recordingStatusReceived: (
      state,
      action: PayloadAction<RecordingStatusPayload>
    ) => {
      const { ip, recording } = action.payload;
      const previousRecordingState = state.devices[ip].current_recording;

      let events = previousRecordingState ? previousRecordingState.events : [];
      if (recording.action === Recording.action.START) {
        events = [];
      }
      state.devices[ip].lastError = "";
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
          lastError: "",
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
      if (sensor.conn_type === piapi.Sensor.conn_type.WEBSOCKET) {
        if (sensor.sensor === piapi.Sensor.sensor.GAZE) {
          device.gazeSensor = sensor;
        }
        if (sensor.sensor === piapi.Sensor.sensor.WORLD) {
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
    editPresetEvent: (state, action: PayloadAction<EditEventPayload>) => {
      const event = action.payload;
      if (event.index < state.presetEvents.length) {
        if (event.name) {
          state.presetEvents[event.index] = event.name;
        } else {
          state.presetEvents[event.index] = `Event ${event.index + 1}`;
        }
      }
    },
  },
});

export const { actions } = monitorSlice;
export const selectDevices = (state: RootState) => state.monitor.devices;

export default monitorSlice.reducer;
