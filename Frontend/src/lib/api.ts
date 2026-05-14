import { getAccessToken } from './auth'

const envApiBase =
  typeof import.meta.env.VITE_API_BASE_URL === 'string'
    ? import.meta.env.VITE_API_BASE_URL.trim().replace(/\/$/, '')
    : ''

/**
 * Browser URL for API and uploaded files. In dev, defaults to Spring Boot
 * ({@code http://localhost:8080}) when {@code VITE_API_BASE_URL} is unset.
 */
export function resolveBackendUrl(path: string | null | undefined): string {
  if (path == null || path === '') {
    return ''
  }
  if (/^https?:\/\//i.test(path)) {
    return path
  }
  if (!path.startsWith('/api') && !path.startsWith('/uploads')) {
    return path
  }
  if (envApiBase) {
    return `${envApiBase}${path}`
  }
  if (import.meta.env.DEV) {
    return `http://localhost:8080${path}`
  }
  return path
}

/** Thrown by {@link api} when the response status is not 2xx (axios-compatible shape). */
export class ApiRequestError extends Error {
  readonly response: { status: number }

  constructor(status: number, message?: string) {
    super(message ?? `Request failed with status ${status}`)
    this.name = 'ApiRequestError'
    this.response = { status }
  }
}

async function request<T>(method: string, path: string, body?: unknown, isFormData?: boolean): Promise<{ data: T }> {
  const url = resolveBackendUrl(path)
  const headers: Record<string, string> = {}
  const token = getAccessToken()
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  if (body != null && !isFormData) {
    headers['Content-Type'] = 'application/json'
  }

  const res = await fetch(url, {
    method,
    headers,
    body: body == null ? undefined : isFormData ? (body as BodyInit) : JSON.stringify(body),
  })

  if (!res.ok) {
    throw new ApiRequestError(res.status)
  }

  if (res.status === 204) {
    return { data: undefined as T }
  }

  const text = await res.text()
  if (!text) {
    return { data: undefined as T }
  }
  return { data: JSON.parse(text) as T }
}

/**
 * Minimal axios-like client for authenticated JSON APIs (Bearer from session).
 */
export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body, body instanceof FormData),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body, false),
}
