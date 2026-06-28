import { clearAuthSession, getAccessToken, getRefreshToken, setAuthSession, type AuthUser } from './auth'

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

/** Resolves stored media URLs (Cloudinary HTTPS, legacy /uploads/, or API paths). */
export function resolveMediaUrl(path: string | null | undefined): string | null {
  if (path == null || path === '') {
    return null
  }
  if (path.startsWith('blob:') || path.startsWith('data:')) {
    return path
  }
  if (/^https?:\/\//i.test(path)) {
    return path
  }
  const resolved = resolveBackendUrl(path)
  return resolved || null
}

/** Profile image URL for display (Google HTTPS URLs or {@code /uploads/...} paths). */
export function resolveProfileImageUrl(path: string | null | undefined): string | null {
  return resolveMediaUrl(path)
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

type AuthTokensPayload = {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

let refreshInFlight: Promise<boolean> | null = null

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const rt = getRefreshToken()
        if (!rt) return false
        const url = resolveBackendUrl('/api/auth/refresh')
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken: rt }),
        })
        if (!res.ok) return false
        const body = (await res.json()) as AuthTokensPayload
        setAuthSession(body.user, body.accessToken, body.refreshToken)
        return true
      } catch {
        return false
      } finally {
        refreshInFlight = null
      }
    })()
  }
  return refreshInFlight
}

async function request<T>(
  method: string,
  path: string,
  body?: unknown,
  isFormData?: boolean,
  skipRefreshRetry?: boolean,
): Promise<{ data: T }> {
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

  if (res.status === 401 && !skipRefreshRetry && getRefreshToken()) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      return request<T>(method, path, body, isFormData, true)
    }
    clearAuthSession()
  }

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
 * Minimal axios-like client for authenticated JSON APIs (Bearer + automatic refresh on 401).
 */
export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, body, body instanceof FormData),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, body, body instanceof FormData),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, body, false),
  delete: <T = void>(path: string) => request<T>('DELETE', path),
}

/**
 * Authenticated fetch with the same Bearer + refresh behaviour as {@link api}.
 * Use when you need the raw {@link Response} (e.g. custom error handling).
 */
export async function authFetch(input: string, init?: RequestInit): Promise<Response> {
  const url = resolveBackendUrl(input)
  const headers = new Headers(init?.headers)
  const token = getAccessToken()
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`)
  }
  let res = await fetch(url, { ...init, headers })

  if (res.status === 401 && getRefreshToken()) {
    const refreshed = await refreshAccessToken()
    if (refreshed) {
      const h2 = new Headers(init?.headers)
      const t2 = getAccessToken()
      if (t2) {
        h2.set('Authorization', `Bearer ${t2}`)
      }
      res = await fetch(url, { ...init, headers: h2 })
    } else {
      clearAuthSession()
    }
  }
  return res
}
