import { BulkClient, type BulkClientConfig } from "bulk-ts-sdk";
import process from "node:process";

export function createClient(config: BulkClientConfig = {}): BulkClient {
  return new BulkClient({
    ...readEndpointConfig(),
    ...config,
  });
}

export function readEndpointConfig(): BulkClientConfig {
  return {
    ...(process.env.BULK_HTTP_URL ? { httpUrl: process.env.BULK_HTTP_URL } : {}),
    ...(process.env.BULK_WS_URL ? { wsUrl: process.env.BULK_WS_URL } : {}),
  };
}

export function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`${name} environment variable is required.`);
  }
  return value;
}

export function readSymbol(): string {
  return process.env.BULK_SYMBOL ?? "BTC-USD";
}
