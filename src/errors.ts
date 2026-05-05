/**
 * Base error class for all Bulk SDK errors.
 */
export class BulkError extends Error {
  /**
   * Creates a base SDK error with the given message.
   * @param message Human-readable error summary.
   */
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Thrown when an HTTP request fails (non-2xx status code).
 */
export class BulkHttpError extends BulkError {
  /**
   * Creates an error for a non-success HTTP response.
   * @param status HTTP status code from the failed response.
   * @param data Parsed response body or structured error payload when available.
   */
  constructor(public status: number, public data?: unknown) {
    super(`HTTP error ${status}${data ? ": " + JSON.stringify(data) : ""}`);
  }
}

/**
 * Thrown when a WebSocket connection or protocol error occurs.
 */
export class BulkWsError extends BulkError {
  /**
   * Creates an error describing a WebSocket failure.
   * @param message Human-readable WebSocket error summary.
   */
  constructor(message: string) {
    super(message);
  }
}

/**
 * Thrown when a request (HTTP or WS) times out.
 */
export class BulkTimeoutError extends BulkError {
  /**
   * Creates an error when an HTTP or WebSocket operation exceeds its deadline.
   * @param message Human-readable timeout summary (often includes elapsed vs limit).
   */
  constructor(message: string) {
    super(message);
  }
}

/**
 * Thrown when a response cannot be decoded or parsed correctly.
 */
export class BulkDecodeError extends BulkError {
  /**
   * Creates an error when a payload cannot be decoded as expected JSON or schema.
   * @param message Human-readable decode failure summary.
   */
  constructor(message: string) {
    super(message);
  }
}

/**
 * Thrown when a transaction is rejected by the API (e.g., status: "error" in order response).
 */
export class BulkTransactionRejectedError extends BulkError {
  /**
   * Creates an error when the venue rejects a signed trading transaction.
   * @param response Raw API response body explaining the rejection.
   */
  constructor(public response: unknown) {
    super(`Transaction rejected: ${JSON.stringify(response)}`);
  }
}
