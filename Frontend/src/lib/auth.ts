export type AuthUser = {
  id: number
  fullName: string
  email: string
  phoneNumber: string
  location: string | null
}

const STORAGE_KEY = 'mednexus.user'
const AUTH_EVENT = 'mednexus:auth-changed'

export const getStoredUser = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

export const setStoredUser = (user: AuthUser) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
  window.dispatchEvent(new Event(AUTH_EVENT))
}

export const clearStoredUser = () => {
  localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new Event(AUTH_EVENT))
}

export const onAuthChange = (handler: () => void) => {
  window.addEventListener(AUTH_EVENT, handler)
  window.addEventListener('storage', handler)
  return () => {
    window.removeEventListener(AUTH_EVENT, handler)
    window.removeEventListener('storage', handler)
  }
}
