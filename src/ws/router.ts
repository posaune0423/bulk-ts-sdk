import type { WsHandler } from "../types/ws.ts";

export class WsRouter {
  private readonly handlers = new Map<string, Set<WsHandler<unknown>>>();

  add<T>(topic: string, handler: WsHandler<T>): void {
    let set = this.handlers.get(topic);
    if (!set) {
      set = new Set();
      this.handlers.set(topic, set);
    }
    set.add(handler as WsHandler<unknown>);
  }

  remove<T>(topic: string, handler: WsHandler<T>): void {
    const set = this.handlers.get(topic);
    if (set) {
      set.delete(handler as WsHandler<unknown>);
      if (set.size === 0) {
        this.handlers.delete(topic);
      }
    }
  }

  dispatch(topic: string, message: unknown): void {
    const set = this.handlers.get(topic);
    if (!set || set.size === 0) {
      return;
    }
    for (const handler of set) {
      // Use queueMicrotask to avoid blocking the WebSocket receive loop
      queueMicrotask(() => {
        Promise.resolve()
          .then(() => handler(message))
          .catch((error) => {
            console.error(`Error in WsHandler for topic ${topic}:`, error);
          });
      });
    }
  }

  clear(): void {
    this.handlers.clear();
  }
}
