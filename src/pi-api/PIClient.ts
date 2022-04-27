/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BaseHttpRequest } from "./core/BaseHttpRequest";
import type { OpenAPIConfig } from "./core/OpenAPI";
import { FetchHttpRequest } from "./core/FetchHttpRequest";

import { EventsService } from "./services/EventsService";
import { RecordingService } from "./services/RecordingService";
import { StatusService } from "./services/StatusService";

type HttpRequestConstructor = new (config: OpenAPIConfig) => BaseHttpRequest;

export class PIClient {
  public readonly events: EventsService;
  public readonly recording: RecordingService;
  public readonly status: StatusService;

  public readonly request: BaseHttpRequest;

  constructor(
    config?: Partial<OpenAPIConfig>,
    HttpRequest: HttpRequestConstructor = FetchHttpRequest,
  ) {
    this.request = new HttpRequest({
      BASE: config?.BASE ?? "http://pi.local:8080/api",
      VERSION: config?.VERSION ?? "1.0.0",
      WITH_CREDENTIALS: config?.WITH_CREDENTIALS ?? false,
      CREDENTIALS: config?.CREDENTIALS ?? "include",
      TOKEN: config?.TOKEN,
      USERNAME: config?.USERNAME,
      PASSWORD: config?.PASSWORD,
      HEADERS: config?.HEADERS,
      ENCODE_PATH: config?.ENCODE_PATH,
    });

    this.events = new EventsService(this.request);
    this.recording = new RecordingService(this.request);
    this.status = new StatusService(this.request);
  }
}
