import { resolveBackendUrl } from './api'

export type ContactMessagePayload = {
  fullName: string
  email: string
  phone: string
  message: string
}

export async function submitContactMessage(payload: ContactMessagePayload): Promise<void> {
  const res = await fetch(resolveBackendUrl('/api/contact'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    let detail = 'Could not send your message. Please try again.'
    try {
      const body = (await res.json()) as { detail?: string; title?: string }
      if (body.detail) detail = body.detail
    } catch {
      // ignore parse errors
    }
    throw new Error(detail)
  }
}
