import { createClient, readSymbol } from "./client.ts";
import process from "node:process";

type L2SnapshotMessage = {
  topic: string;
  data?: {
    book?: {
      levels?: [
        Array<{ px?: number; sz?: number }>,
        Array<{ px?: number; sz?: number }>,
      ];
    };
  };
};

const client = createClient();
const symbol = readSymbol();

console.log("--- WebSocket Market Data Example ---");

try {
  console.log(`Subscribing to L2 Book for ${symbol}...`);
  const handle = await client.ws.subscribe(
    { type: "l2Snapshot", symbol },
    (message: unknown) => {
      const snapshot = message as L2SnapshotMessage;
      const levels = snapshot.data?.book?.levels;
      console.log("\n[WS L2Book Update]");
      console.log("Topic:", snapshot.topic);
      if (levels) {
        console.log("Top Bid:", levels[0][0]?.px, "@", levels[0][0]?.sz);
        console.log("Top Ask:", levels[1][0]?.px, "@", levels[1][0]?.sz);
      }
    },
  );

  console.log("\nListening for 10 seconds...");
  await new Promise((resolve) => setTimeout(resolve, 10000));

  console.log("\nUnsubscribing...");
  await handle.unsubscribe();

  console.log("Closing WebSocket...");
  await client.ws.close();

  console.log("Example finished.");
} catch (error) {
  console.error("Error during WebSocket example:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
