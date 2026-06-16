import { api } from './api'

export type EsewaInitiateResponse = {
  formUrl: string
  fields: Record<string, string>
}

export async function initiateEsewaPayment(cartItemIds: number[]): Promise<EsewaInitiateResponse> {
  const { data } = await api.post<EsewaInitiateResponse>('/api/payments/esewa/initiate', { cartItemIds })
  return data
}

export function submitEsewaPaymentForm(formUrl: string, fields: Record<string, string>): void {
  const form = document.createElement('form')
  form.method = 'POST'
  form.action = formUrl
  form.style.display = 'none'

  for (const [name, value] of Object.entries(fields)) {
    const input = document.createElement('input')
    input.type = 'hidden'
    input.name = name
    input.value = value
    form.appendChild(input)
  }

  document.body.appendChild(form)
  form.submit()
}
