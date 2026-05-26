import { resolveBackendUrl } from './api'
import type { AuthUser } from './auth'

const GOOGLE_AUTH_PATH = '/api/auth/google'

const GOOGLE_CLIENT_ID =
  '98369240272-5aoh1lvk62hhl3s27bcmj5nol9v873me.apps.googleusercontent.com'

export type GoogleAuthResponse = {
  accessToken: string
  refreshToken: string
  user: AuthUser
}

export function getGoogleClientId(): string {
  const fromEnv =
    typeof import.meta.env.VITE_GOOGLE_CLIENT_ID === 'string'
      ? import.meta.env.VITE_GOOGLE_CLIENT_ID.trim()
      : ''
  return fromEnv || GOOGLE_CLIENT_ID
}

function messageFromBody(body: unknown): string | null {
  if (body == null || typeof body !== 'object') {
    return null
  }
  const record = body as Record<string, unknown>
  if (typeof record.message === 'string' && record.message.trim()) {
    return record.message.trim()
  }
  if (typeof record.detail === 'string' && record.detail.trim()) {
    return record.detail.trim()
  }
  if (typeof record.error === 'string' && record.error.trim()) {
    return record.error.trim()
  }
  return null
}

function defaultMessageForStatus(status: number): string {
  switch (status) {
    case 400:
      return 'Invalid Google sign-in request.'
    case 401:
      return 'Google sign-in could not be verified. Please try again.'
    case 403:
      return 'This account is not allowed to sign in here.'
    case 409:
      return 'This email is already registered with a different sign-in method.'
    default:
      return 'Google sign-in failed. Please try again.'
  }
}

export async function completeGoogleSignIn(idToken: string): Promise<GoogleAuthResponse> {
  const res = await fetch(resolveBackendUrl(GOOGLE_AUTH_PATH), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  })

  if (!res.ok) {
    let body: unknown
    try {
      body = await res.json()
    } catch {
      body = null
    }
    throw new Error(messageFromBody(body) ?? defaultMessageForStatus(res.status))
  }

  return (await res.json()) as GoogleAuthResponse
}
