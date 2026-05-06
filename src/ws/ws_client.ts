import { BulkTimeoutError, BulkWsError } from "../errors.ts";
import { safeJsonParse } from "../utils/json.ts";
import { WsRouter } from "./router.ts";
import { topicOf } from "./subscriptions.ts";
import type {
  SubscriptionHandle,
  WsClientOutbound,
  WsHandler,
  WsMessageForSubscription,
  WsPostOptions,
  WsSubscription,
} from "../types/ws.ts";
import type { OrderResponse, SignedTransaction } from "../types/trade.ts";

type WsClientConfig = {
  url: string;
  timeoutMs: number;
};

export class WsClient {
  private ws: WebSocket | null = null;
  private readonly router = new WsRouter();
  private readonly topicRefCounts = new Map<string, number>();
  private nextRequestId = 1;
  private readonly pendingPosts = new Map<
    number,
    {
      resolve: (response: OrderResponse) => void;
      reject: (error: unknown) => void;
      timer: number;
    }
  >();

  constructor(private readonly config: WsClientConfig) {}

  connect(): Promise<void> {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.config.url);
        this.ws.onopen = () => resolve();
        this.ws.onerror = (event) => {
          const message = (event as ErrorEvent).message || "Unknown error";
          reject(new BulkWsError(`WebSocket error: ${message}`));
        };
        this.ws.onmessage = (event) => this.handleMessage(event.data);
        this.ws.onclose = () => this.handleClose();
      } catch (error) {
        reject(error);
      }
    });
  }

  close(): Promise<void> {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    return Promise.resolve();
  }

  async subscribe<S extends WsSubscription>(
    subscription: S,
    handler: WsHandler<WsMessageForSubscription<S>>,
  ): Promise<SubscriptionHandle>;
  async subscribe<T>(
    subscription: WsSubscription,
    handler: WsHandler<T>,
  ): Promise<SubscriptionHandle>;
  async subscribe(
    subscription: WsSubscription,
    handler: WsHandler<never>,
  ): Promise<SubscriptionHandle> {
    await this.ensureConnected();

    const topics = topicOf(subscription);
    let shouldSendSubscribe = false;
    for (const topic of topics) {
      this.router.add(topic, handler);
      const count = this.topicRefCounts.get(topic) ?? 0;
      this.topicRefCounts.set(topic, count + 1);
      shouldSendSubscribe ||= count === 0;
    }

    if (shouldSendSubscribe) {
      this.send({
        method: "subscribe",
        subscription: [subscription],
      });
    }

    let unsubscribed = false;

    return {
      topics,
      unsubscribe: () => {
        if (unsubscribed) return Promise.resolve();
        unsubscribed = true;
        for (const topic of topics) {
          this.router.remove(topic, handler);
          if (this.releaseTopic(topic)) {
            this.send({
              method: "unsubscribe",
              topic,
            });
          }
        }
        return Promise.resolve();
      },
    };
  }

  async post(
    tx: SignedTransaction,
    options: WsPostOptions = {},
  ): Promise<OrderResponse> {
    await this.ensureConnected();
    const id = this.nextRequestId++;
    const timeoutMs = options.timeoutMs ?? this.config.timeoutMs;

    const promise = new Promise<OrderResponse>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingPosts.delete(id);
        reject(new BulkTimeoutError(`WS post timed out: ${id}`));
      }, timeoutMs);
      this.pendingPosts.set(id, { resolve, reject, timer });
    });

    this.send({
      method: "post",
      request: {
        type: "action",
        payload: tx,
      },
      id,
    });

    return await promise;
  }

  private async ensureConnected(): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      await this.connect();
    }
  }

  private send(message: WsClientOutbound): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new BulkWsError("WebSocket is not open");
    }
    this.ws.send(JSON.stringify(message));
  }

  private handleMessage(data: string): void {
    const message = safeJsonParse(data);
    if (!this.isRecord(message)) return;

    // Handle post response
    if (message.type === "post" && typeof message.id === "number") {
      const pending = this.pendingPosts.get(message.id);
      if (pending) {
        clearTimeout(pending.timer);
        this.pendingPosts.delete(message.id);
        const payload = this.extractPostPayload(message);
        if (payload !== undefined) {
          pending.resolve(payload);
        } else {
          pending.reject(new BulkWsError(`Invalid post response: ${data}`));
        }
      }
      return;
    }

    // Handle subscription messages
    const topic = message.topic;
    if (typeof topic === "string") {
      this.router.dispatch(topic, message);
      return;
    }

    // Handle subscription responses
    const method = message.method;
    if (method === "subscribe" || method === "unsubscribe") {
      // Could log or resolve subscription promise here if we had one
      return;
    }
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null;
  }

  private extractPostPayload(message: Record<string, unknown>): OrderResponse | undefined {
    const dataField = message.data;
    if (!this.isRecord(dataField)) return undefined;
    const payload = dataField.payload;
    if (payload === undefined || !this.isRecord(payload)) return undefined;
    return payload as OrderResponse;
  }

  private releaseTopic(topic: string): boolean {
    const count = this.topicRefCounts.get(topic);
    if (count === undefined) return false;
    if (count > 1) {
      this.topicRefCounts.set(topic, count - 1);
      return false;
    }
    this.topicRefCounts.delete(topic);
    return true;
  }

  private handleClose(): void {
    // Reject all pending posts
    for (const [_id, pending] of this.pendingPosts) {
      clearTimeout(pending.timer);
      pending.reject(new BulkWsError("WebSocket closed while post was pending"));
    }
    this.pendingPosts.clear();
    this.topicRefCounts.clear();
    this.router.clear();
    this.ws = null;
  }
}
