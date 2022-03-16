/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { EventEnvelope } from '../models/EventEnvelope';
import type { EventPost } from '../models/EventPost';

import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';

export class EventsService {

  constructor(public readonly httpRequest: BaseHttpRequest) {}

  /**
   * create recording event
   * @param requestBody recording event
   * @returns EventEnvelope recording event added
   * @throws ApiError
   */
  public postEvent(
    requestBody?: EventPost,
  ): CancelablePromise<EventEnvelope> {
    return this.httpRequest.request({
      method: 'POST',
      url: '/event',
      body: requestBody,
      mediaType: 'application/json',
    });
  }

}