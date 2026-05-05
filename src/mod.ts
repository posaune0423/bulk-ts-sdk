/**
 * Unofficial TypeScript SDK for Bulk Exchange.
 *
 * This community-supported module provides a unified client for interacting with the Bulk Exchange
 * via HTTP (Market, Account, Trade) and WebSocket (Real-time) protocols.
 *
 * @module
 */

export { BulkClient } from "./client.ts";
export type { BulkClientConfig } from "./client.ts";
export * from "./types/index.ts";
export * from "./errors.ts";

/**
 * Default HTTP endpoint for the Bulk Exchange API.
 */
export { BULK_DEFAULT_HTTP_URL } from "./constants.ts";

/**
 * Default WebSocket endpoint for the Bulk Exchange real-time API.
 */
export { BULK_DEFAULT_WS_URL } from "./constants.ts";
