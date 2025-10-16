import { EventType } from "@shared/types/core/event-types";
import {
  ModelStreamErrorData,
  ModelStreamLatencyData,
  ModelStreamTextData,
  ModelStreamUsageData,
} from "@shared/types/comparison";

export type EventToDataTypeMap = {
  [EventType.LATENCY_MS]: ModelStreamLatencyData;
  [EventType.TEXT]: ModelStreamTextData;
  [EventType.ERROR]: ModelStreamErrorData;
  [EventType.USAGE]: ModelStreamUsageData;
  [EventType.COMPLETE]: null;
};

type EventHandlers = {
  [K in keyof EventToDataTypeMap]?: (data: EventToDataTypeMap[K]) => void;
};

export class SSEHandler {
  private eventSource: EventSource;
  private onErrorCallback?: (error: Event) => void;
  private isClosed = false;

  constructor(streamUrl: string) {
    this.eventSource = new EventSource(streamUrl, {
      withCredentials: true,
    });

    this.eventSource.onopen = () => {
      this.isClosed = false;
    };

    this.eventSource.onerror = (error) => {
      console.error("SSE connection error:", error);
      console.error("EventSource readyState:", this.eventSource.readyState);

      if (!this.isClosed) {
        this.isClosed = true;
        this.eventSource.close();
      }

      if (this.onErrorCallback) {
        this.onErrorCallback(error);
      }
    };
  }

  onConnectionError(callback: (error: Event) => void) {
    this.onErrorCallback = callback;
    return this;
  }

  on<T extends keyof EventToDataTypeMap>(event: T, callback: (data: EventToDataTypeMap[T]) => void) {
    this.eventSource.addEventListener(event, (e) => {
      if (event === EventType.COMPLETE) {
        callback(null as EventToDataTypeMap[T]);
        this.close();
      } else {
        const parsedData = JSON.parse((e as MessageEvent).data);
        callback(parsedData as EventToDataTypeMap[T]);
      }
    });
    return this;
  }

  listen(handlers: EventHandlers) {
    if (handlers[EventType.LATENCY_MS]) {
      this.on(EventType.LATENCY_MS, handlers[EventType.LATENCY_MS]);
    }
    if (handlers[EventType.TEXT]) {
      this.on(EventType.TEXT, handlers[EventType.TEXT]);
    }
    if (handlers[EventType.ERROR]) {
      this.on(EventType.ERROR, handlers[EventType.ERROR]);
    }
    if (handlers[EventType.USAGE]) {
      this.on(EventType.USAGE, handlers[EventType.USAGE]);
    }
    if (handlers[EventType.COMPLETE]) {
      this.on(EventType.COMPLETE, handlers[EventType.COMPLETE]);
    }
    return this;
  }

  async close() {
    if (!this.isClosed) {
      this.isClosed = true;
      this.eventSource.close();
    }
  }
}
