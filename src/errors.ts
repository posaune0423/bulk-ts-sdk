/**
 * Base error class for all Bulk SDK errors.
 */
export class BulkError extends Error {
  constructor(message: string) {
    super(message)
    this.name = this.constructor.name
  }
}

/**
 * Thrown when an HTTP request fails (non-2xx status code).
 */
export class BulkHttpError extends BulkError {
  constructor(public status: number, public data?: unknown) {
    super(`HTTP error ${status}${data ? ': ' + JSON.stringify(data) : ''}`)
  }
}

/**
 * Thrown when a WebSocket connection or protocol error occurs.
 */
export class BulkWsError extends BulkError {
  constructor(message: string) {
    super(message)
  }
}

/**
 * Thrown when a request (HTTP or WS) times out.
 */
export class BulkTimeoutError extends BulkError {
  constructor(message: string) {
    super(message)
  }
}

/**
 * Thrown when a response cannot be decoded or parsed correctly.
 */
export class BulkDecodeError extends BulkError {
  constructor(message: string) {
    super(message)
  }
}

/**
 * Thrown when a transaction is rejected by the API (e.g., status: "error" in order response).
 */
export class BulkTransactionRejectedError extends BulkError {
  constructor(public response: unknown) {
    super(`Transaction rejected: ${JSON.stringify(response)}`)
  }
}
