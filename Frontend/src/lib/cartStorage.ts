export type CartLine = {
  id: string
  name: string
  subtitle: string
  strength: string
  form: string
  pack: string
  unitPrice: number
  image: string
  qty: number
}

const STORAGE_KEY = 'mednexus-cart'

function normalizeLine(row: Record<string, unknown>): CartLine | null {
  const id = typeof row.id === 'string' ? row.id : ''
  const name = typeof row.name === 'string' ? row.name : ''
  const subtitle = typeof row.subtitle === 'string' ? row.subtitle : ''
  const strength = typeof row.strength === 'string' ? row.strength : ''
  const form = typeof row.form === 'string' ? row.form : ''
  const pack = typeof row.pack === 'string' ? row.pack : ''
  const unitPrice = typeof row.unitPrice === 'number' && Number.isFinite(row.unitPrice) ? row.unitPrice : Number.NaN
  const image = typeof row.image === 'string' ? row.image : ''
  const qty = typeof row.qty === 'number' && row.qty > 0 ? Math.floor(row.qty) : 0

  if (!id || !name || !Number.isFinite(unitPrice) || qty < 1) return null
  return { id, name, subtitle, strength, form, pack, unitPrice, image, qty }
}

export function loadCart(): CartLine[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []

    return parsed
      .map((item) => (item && typeof item === 'object' ? normalizeLine(item as Record<string, unknown>) : null))
      .filter((line): line is CartLine => line !== null)
  } catch {
    return []
  }
}

export function saveCart(lines: CartLine[]): void {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
}

export function addToCart(input: Omit<CartLine, 'qty'> & { qty?: number }): CartLine[] {
  const { qty: requestedQty, ...rest } = input
  const addQty = requestedQty !== undefined && requestedQty > 0 ? Math.floor(requestedQty) : 1
  const cart = loadCart()
  const idx = cart.findIndex((line) => line.id === rest.id)

  if (idx >= 0) {
    cart[idx] = { ...cart[idx], qty: cart[idx].qty + addQty }
  } else {
    cart.push({ ...rest, qty: addQty })
  }

  saveCart(cart)
  return cart
}
