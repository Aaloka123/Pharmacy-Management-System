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

/** Admin stays tab-scoped; user/vendor persist until logout. */
function storageForRole(role: Role): Storage | null {
  if (typeof window === 'undefined') return null
  return role === 'ADMIN' ? window.sessionStorage : window.localStorage
}

function sessionStore(): Storage | null {
  return typeof window !== 'undefined' ? window.sessionStorage : null
}

function localStore(): Storage | null {
  return typeof window !== 'undefined' ? window.localStorage : null
}

function parseUser(raw: string | null): AuthUser | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as AuthUser
  } catch {
    return null
  }
}

function clearKeys(target: Storage | null) {
  target?.removeItem(STORAGE_KEY)
  target?.removeItem(ACCESS_TOKEN_KEY)
  target?.removeItem(REFRESH_TOKEN_KEY)
}

function writeSession(target: Storage, user: AuthUser, accessToken: string, refreshToken: string) {
  target.setItem(ACCESS_TOKEN_KEY, accessToken)
  target.setItem(REFRESH_TOKEN_KEY, refreshToken)
  target.setItem(STORAGE_KEY, JSON.stringify(user))
}

function readFrom(target: Storage | null): { user: AuthUser; accessToken: string; refreshToken: string | null } | null {
  if (!target) return null
  const user = parseUser(target.getItem(STORAGE_KEY))
  const accessToken = target.getItem(ACCESS_TOKEN_KEY)
  if (!user || !accessToken) return null
  return {
    user,
    accessToken,
    refreshToken: target.getItem(REFRESH_TOKEN_KEY),
  }
}

/**
 * Active session lookup:
 * 1. Admin in sessionStorage (tab-only)
 * 2. User/vendor in localStorage (persistent)
 * 3. Migrate legacy user/vendor still sitting in sessionStorage → localStorage
 */
function activeSession(): { store: Storage; user: AuthUser; accessToken: string; refreshToken: string | null } | null {
  const session = readFrom(sessionStore())
  if (session?.user.role === 'ADMIN') {
    return { store: sessionStore()!, ...session }
  }

  const local = readFrom(localStore())
  if (local && local.user.role !== 'ADMIN') {
    return { store: localStore()!, ...local }
  }

  // Legacy: user/vendor previously saved in sessionStorage
  if (session && session.user.role !== 'ADMIN') {
    const localTarget = localStore()
    if (localTarget && session.refreshToken) {
      writeSession(localTarget, session.user, session.accessToken, session.refreshToken)
      clearKeys(sessionStore())
      return { store: localTarget, ...session }
    }
  }

  return null
}

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

export const getStoredUser = (): AuthUser | null => activeSession()?.user ?? null

export const setStoredUser = (user: AuthUser) => {
  const target = storageForRole(user.role)
  if (!target) return
  const existing = readFrom(target)
  target.setItem(STORAGE_KEY, JSON.stringify(user))
  // Keep tokens if already present in this store
  if (!existing?.accessToken) {
    // Profile update without tokens shouldn't leave orphan user records
  }
  window.dispatchEvent(new Event(AUTH_EVENT))
}

export const getAccessToken = (): string | null => activeSession()?.accessToken ?? null

export const getRefreshToken = (): string | null => activeSession()?.refreshToken ?? null

export const setAccessToken = (token: string | null) => {
  const session = activeSession()
  if (!session) return
  if (token) {
    session.store.setItem(ACCESS_TOKEN_KEY, token)
  } else {
    session.store.removeItem(ACCESS_TOKEN_KEY)
  }
}

/** Persist user, access JWT, and refresh token (e.g. after {@code /api/auth/login}). */
export const setAuthSession = (user: AuthUser, accessToken: string, refreshToken: string) => {
  const target = storageForRole(user.role)
  if (!target) return

  // Avoid mixing admin (tab) with user/vendor (persistent) sessions.
  if (user.role === 'ADMIN') {
    clearKeys(localStore())
  } else {
    clearKeys(sessionStore())
  }

  writeSession(target, user, accessToken, refreshToken)
  window.dispatchEvent(new Event(AUTH_EVENT))
}

export const clearStoredUser = () => {
  clearKeys(sessionStore())
  clearKeys(localStore())
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
  const onStorage = (event: StorageEvent) => {
    if (
      event.key === STORAGE_KEY ||
      event.key === ACCESS_TOKEN_KEY ||
      event.key === REFRESH_TOKEN_KEY ||
      event.key === null
    ) {
      handler()
    }
  }
  window.addEventListener('storage', onStorage)
  return () => {
    window.removeEventListener(AUTH_EVENT, handler)
    window.removeEventListener('storage', onStorage)
  }
}
