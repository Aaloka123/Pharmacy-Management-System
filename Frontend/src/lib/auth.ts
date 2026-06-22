export type Role = 'ADMIN' | 'VENDOR' | 'USER'

export type AuthUser = {
  id: number
  fullName: string
  email: string
  phoneNumber: string
  location: string | null
  profileImage?: string | null
  role: Role
}

export const homePathForRole = (role: Role): string => {
  switch (role) {
    case 'ADMIN':
      return '/admindashboard'
    case 'VENDOR':
      return '/vendordashboard'
    case 'USER':
    default:
      return '/'
  }
}

export const LOCATION_REQUIRED_MESSAGE = 'Please put location first'

export const hasUserLocation = (user?: AuthUser | null): boolean => Boolean(user?.location?.trim())

const STORAGE_KEY = 'mednexus.user'
const ACCESS_TOKEN_KEY = 'mednexus.accessToken'
const REFRESH_TOKEN_KEY = 'mednexus.refreshToken'
const AUTH_EVENT = 'mednexus:auth-changed'

// Tab-scoped session: stored in `sessionStorage` so each new tab is its own
// session. Opening the app in a new tab logs you out for that tab.
const store: Storage | null = typeof window !== 'undefined' ? window.sessionStorage : null

function logoutRequestUrl(): string {
  const path = '/api/auth/logout'
  const envApiBase =
    typeof import.meta.env.VITE_API_BASE_URL === 'string'
      ? import.meta.env.VITE_API_BASE_URL.trim().replace(/\/$/, '')
      : ''
  if (envApiBase) {
    return `${envApiBase}${path}`
  }
  if (import.meta.env.DEV) {
    return `http://localhost:8080${path}`
  }
  return path
}

export const getStoredUser = (): AuthUser | null => {
  try {
    const raw = store?.getItem(STORAGE_KEY) ?? null
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

export const setStoredUser = (user: AuthUser) => {
  store?.setItem(STORAGE_KEY, JSON.stringify(user))
  window.dispatchEvent(new Event(AUTH_EVENT))
}

export const getAccessToken = (): string | null => store?.getItem(ACCESS_TOKEN_KEY) ?? null

export const getRefreshToken = (): string | null => store?.getItem(REFRESH_TOKEN_KEY) ?? null

export const setAccessToken = (token: string | null) => {
  if (token) {
    store?.setItem(ACCESS_TOKEN_KEY, token)
  } else {
    store?.removeItem(ACCESS_TOKEN_KEY)
  }
}

const setRefreshToken = (token: string | null) => {
  if (token) {
    store?.setItem(REFRESH_TOKEN_KEY, token)
  } else {
    store?.removeItem(REFRESH_TOKEN_KEY)
  }
}

/** Persist user, access JWT, and refresh token (e.g. after {@code /api/auth/login}). */
export const setAuthSession = (user: AuthUser, accessToken: string, refreshToken: string) => {
  setAccessToken(accessToken)
  setRefreshToken(refreshToken)
  setStoredUser(user)
}

export const clearStoredUser = () => {
  store?.removeItem(STORAGE_KEY)
  store?.removeItem(ACCESS_TOKEN_KEY)
  store?.removeItem(REFRESH_TOKEN_KEY)
  window.dispatchEvent(new Event(AUTH_EVENT))
}

/** Clear user, tokens, and notify listeners (logout). Revokes refresh token on the server when possible. */
export const clearAuthSession = () => {
  const rt = getRefreshToken()
  clearStoredUser()
  if (rt) {
    void fetch(logoutRequestUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: rt }),
    }).catch(() => {
      /* offline / server down — session already cleared locally */
    })
  }
}

export const onAuthChange = (handler: () => void) => {
  window.addEventListener(AUTH_EVENT, handler)
  return () => {
    window.removeEventListener(AUTH_EVENT, handler)
  }
}
