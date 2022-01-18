export enum RecordingAction {
  START = "START",
  STOP = "STOP",
  DISCARD = "DISCARD",
  ERROR = "ERROR",
  SAVE = "SAVE",
}

export type Recording = {
  id: string; // "8dd5fd00-b987-4045-b31a-6368f6a6f1c2"
  action: RecordingAction; // "STOP"
  rec_duration_ns: number; // 63881000000
  message: string; // "Stopped recording"
};
