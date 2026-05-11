export type Role = 'ADMIN' | 'VENDOR' | 'USER'

export type AuthUser = {
  id: number
  fullName: string
  email: string
  phoneNumber: string
  location: string | null
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

const STORAGE_KEY = 'mednexus.user'
const AUTH_EVENT = 'mednexus:auth-changed'

// Tab-scoped session: stored in `sessionStorage` so each new tab is its own
// session. Opening the app in a new tab logs you out for that tab.
const store: Storage | null = typeof window !== 'undefined' ? window.sessionStorage : null

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

export const clearStoredUser = () => {
  store?.removeItem(STORAGE_KEY)
  window.dispatchEvent(new Event(AUTH_EVENT))
}

export const onAuthChange = (handler: () => void) => {
  window.addEventListener(AUTH_EVENT, handler)
  return () => {
    window.removeEventListener(AUTH_EVENT, handler)
  }
}
