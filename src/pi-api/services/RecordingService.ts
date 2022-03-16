/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { RecordingCancelEnvelope } from "../models/RecordingCancelEnvelope";
import type { RecordingStartEnvelope } from "../models/RecordingStartEnvelope";
import type { RecordingStopEnvelope } from "../models/RecordingStopEnvelope";

import type { CancelablePromise } from "../core/CancelablePromise";
import type { BaseHttpRequest } from "../core/BaseHttpRequest";

export class RecordingService {
  constructor(public readonly httpRequest: BaseHttpRequest) {}

  /**
   * start recording
   * @returns RecordingStartEnvelope recording started
   * @throws ApiError
   */
  public postRecordingStart(): CancelablePromise<RecordingStartEnvelope> {
    return this.httpRequest.request({
      method: "POST",
      url: "/recording:start",
      errors: {
        500: `recording start failed <br />Possible errors: <br /> - Recording running <br /> - Template has required fields <br /> - Low battery <br /> - Low storage <br /> - No wearer selected <br /> - No workspace selected <br /> - Setup bottom sheets not completed`,
      },
    });
  }

  /**
   * stop and save recording
   * stop and save recording, only possible if template has no required fields
   * @returns RecordingStopEnvelope recording stopped and saved
   * @throws ApiError
   */
  public postRecordingStopAndSave(): CancelablePromise<RecordingStopEnvelope> {
    return this.httpRequest.request({
      method: "POST",
      url: "/recording:stop_and_save",
      errors: {
        500: `recording stop and save failed <br />Possible errors: <br /> - Recording not running <br /> - template has required fields`,
      },
    });
  }

  /**
   * cancel recording
   * cancel recording
   * @returns RecordingCancelEnvelope recording stopped and discarded
   * @throws ApiError
   */
  public postRecordingCancel(): CancelablePromise<RecordingCancelEnvelope> {
    return this.httpRequest.request({
      method: "POST",
      url: "/recording:cancel",
      errors: {
        500: `recording cancel failed <br />Possible errors: <br /> - Recording not running`,
      },
    });
  }
}
