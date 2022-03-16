/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { StatusEnvelope } from "../models/StatusEnvelope";

import type { CancelablePromise } from "../core/CancelablePromise";
import type { BaseHttpRequest } from "../core/BaseHttpRequest";

export class StatusService {
  constructor(public readonly httpRequest: BaseHttpRequest) {}

  /**
   * phone status; upgrade to websocket connection; updates about Phone/Sensor/Recording/NetworkDevice/Event updates
   * @returns StatusEnvelope phone status
   * @throws ApiError
   */
  public getStatus(): CancelablePromise<StatusEnvelope> {
    return this.httpRequest.request({
      method: "GET",
      url: "/status",
    });
  }
}
