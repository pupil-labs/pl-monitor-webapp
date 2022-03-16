/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */

export type Recording = {
  readonly id: string;
  rec_duration_ns: number;
  message: string;
  action: Recording.action;
};

export namespace Recording {
  export enum action {
    START = "START",
    STOP = "STOP",
    SAVE = "SAVE",
    DISCARD = "DISCARD",
    ERROR = "ERROR",
  }
}
