export const PHONE_LENGTH = 10

export function sanitizePhoneInput(value: string): string {
  return value.replace(/\D/g, '').slice(0, PHONE_LENGTH)
}

export function isValidPhoneNumber(phone: string): boolean {
  return /^\d{10}$/.test(phone.trim())
}

export const phoneInputProps = {
  type: 'tel' as const,
  inputMode: 'numeric' as const,
  pattern: '\\d{10}',
  minLength: PHONE_LENGTH,
  maxLength: PHONE_LENGTH,
  title: 'Phone number must be exactly 10 digits',
}
