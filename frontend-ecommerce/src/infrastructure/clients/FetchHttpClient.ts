import type { HttpClient } from '@infrastructure/clients/HttpClient'

interface FetchHttpClientOptions {
  baseUrl: string
  timeoutMs?: number
  getAuthorizationHeader?: () => string | null
}

interface ErrorPayload {
  error?: {
    message?: string
  }
}

export class FetchHttpClient implements HttpClient {
  private readonly baseUrl: string
  private readonly timeoutMs: number
  private readonly getAuthorizationHeader: (() => string | null) | undefined

  constructor(options: FetchHttpClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '')
    this.timeoutMs = options.timeoutMs ?? 10_000
    this.getAuthorizationHeader = options.getAuthorizationHeader
  }

  async get<T>(path: string): Promise<T> {
    return await this.request<T>(path, { method: 'GET' })
  }

  async post<TResponse, TBody>(path: string, body: TBody): Promise<TResponse> {
    return await this.request<TResponse>(path, {
      method: 'POST',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  async put<TResponse, TBody>(path: string, body: TBody): Promise<TResponse> {
    return await this.request<TResponse>(path, {
      method: 'PUT',
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/json',
      },
    })
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs)

    try {
      const authorizationHeader = this.getAuthorizationHeader?.()

      const response = await fetch(`${this.baseUrl}${normalizedPath}`, {
        ...init,
        headers: {
          Accept: 'application/json',
          ...(authorizationHeader ? { Authorization: authorizationHeader } : {}),
          ...init.headers,
        },
        signal: controller.signal,
      })

      if (!response.ok) {
        let backendMessage: string | undefined

        try {
          const payload = (await response.json()) as ErrorPayload
          backendMessage = payload.error?.message
        } catch {
          backendMessage = undefined
        }

        throw new Error(`HTTP ${response.status}: ${backendMessage ?? response.statusText}`)
      }

      return (await response.json()) as T
    } finally {
      clearTimeout(timeoutId)
    }
  }
}
