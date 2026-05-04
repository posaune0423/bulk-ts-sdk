import { BulkHttpError, BulkTimeoutError } from '../errors.ts'
import { buildUrl } from '../utils/url.ts'
import { safeJsonParse } from '../utils/json.ts'

export type HttpTransportConfig = {
  baseUrl: string
  timeoutMs: number
  headers?: Record<string, string>
}

export type HttpRequestOptions = {
  query?: Record<string, string | number | boolean | undefined>
  signal?: AbortSignal
  timeoutMs?: number
  headers?: Record<string, string>
}

export class HttpTransport {
  constructor(private readonly config: HttpTransportConfig) {}

  async get<T>(path: string, options: HttpRequestOptions = {}): Promise<T> {
    return await this.request<T>('GET', path, undefined, options)
  }

  async post<T>(
    path: string,
    body?: unknown,
    options: HttpRequestOptions = {},
  ): Promise<T> {
    return await this.request<T>('POST', path, body, options)
  }

  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    body: unknown,
    options: HttpRequestOptions,
  ): Promise<T> {
    const url = buildUrl(this.config.baseUrl, path, options.query)
    const controller = new AbortController()
    const timeoutMs = options.timeoutMs ?? this.config.timeoutMs
    let isTimeout = false
    const timer = setTimeout(() => {
      isTimeout = true
      controller.abort()
    }, timeoutMs)

    try {
      const response = await fetch(url, {
        method,
        headers: {
          'content-type': 'application/json',
          ...this.config.headers,
          ...options.headers,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: options.signal ?? controller.signal,
      })

      const text = await response.text()
      const json = text.length > 0 ? safeJsonParse(text) : undefined

      if (!response.ok) {
        throw new BulkHttpError(response.status, json)
      }

      return json as T
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        if (isTimeout) {
          throw new BulkTimeoutError(`HTTP request timed out: ${method} ${path}`)
        }
      }
      throw error
    } finally {
      clearTimeout(timer)
    }
  }
}
