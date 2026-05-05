import { assertEquals } from "@std/assert";
import { WsRouter } from "../../src/ws/router.ts";

Deno.test("WsRouter dispatch", async () => {
  const router = new WsRouter();
  let received: unknown = null;
  const handler = (msg: unknown) => {
    received = msg;
  };

  router.add("ticker.BTC-USD", handler);
  router.dispatch("ticker.BTC-USD", { price: 100000 });

  await new Promise((resolve) => setTimeout(resolve, 0));
  assertEquals(received, { price: 100000 });
});

Deno.test("WsRouter multiple handlers", async () => {
  const router = new WsRouter();
  let count = 0;
  const handler1 = () => {
    count++;
  };
  const handler2 = () => {
    count++;
  };

  router.add("topic", handler1);
  router.add("topic", handler2);
  router.dispatch("topic", {});

  await new Promise((resolve) => setTimeout(resolve, 0));
  assertEquals(count, 2);
});

Deno.test("WsRouter remove handler", async () => {
  const router = new WsRouter();
  let count = 0;
  const handler = () => {
    count++;
  };

  router.add("topic", handler);
  router.remove("topic", handler);
  router.dispatch("topic", {});

  await new Promise((resolve) => setTimeout(resolve, 0));
  assertEquals(count, 0);
});
