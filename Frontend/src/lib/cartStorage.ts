import { ApiRequestError } from './api'
import { getAccessToken, getStoredUser } from './auth'
import { addProductToCart } from './cartApi'

export type CartLine = {
  id: string
  productId: number
  name: string
  subtitle: string
  strength: string
  form: string
  pack: string
  unitPrice: number
  image: string
  qty: number
  stock: number
  vendorName: string
  vendorStoreOpen: boolean
  productActive: boolean
}

export class CartAuthRequiredError extends Error {
  constructor() {
    super('Please log in to add items to your cart.')
    this.name = 'CartAuthRequiredError'
  }
}

export function isCartUserLoggedIn(): boolean {
  const user = getStoredUser()
  return Boolean(getAccessToken() && user && user.role !== 'VENDOR')
}

export const CART_CHANGED_EVENT = 'mednexus:cart-changed'

export function notifyCartChanged(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(CART_CHANGED_EVENT))
  }
}

export function onCartChanged(handler: () => void): () => void {
  window.addEventListener(CART_CHANGED_EVENT, handler)
  return () => window.removeEventListener(CART_CHANGED_EVENT, handler)
}

export async function addToCart(input: { productId: number; quantity?: number }): Promise<void> {
  if (!isCartUserLoggedIn()) {
    throw new CartAuthRequiredError()
  }
  await addProductToCart(input.productId, input.quantity ?? 1)
  notifyCartChanged()
}

export function isCartApiError(error: unknown): error is ApiRequestError {
  return error instanceof ApiRequestError
}

export function hasClosedVendorItems(lines: CartLine[]): boolean {
  return lines.some((line) => line.vendorStoreOpen === false)
}

export function closedVendorNames(lines: CartLine[]): string[] {
  return [...new Set(lines.filter((line) => !line.vendorStoreOpen).map((line) => line.vendorName))]
}

export function isCartLineSelectable(line: CartLine): boolean {
  return line.productActive && line.vendorStoreOpen && line.stock > 0 && line.qty <= line.stock
}

export function cartLineUnavailableReason(line: CartLine): string | null {
  if (!line.productActive) {
    return 'This product is no longer available.'
  }
  if (!line.vendorStoreOpen) {
    return `${line.vendorName} is currently closed.`
  }
  if (line.stock <= 0) {
    return 'This product is out of stock.'
  }
  if (line.qty > line.stock) {
    return `Only ${line.stock} unit${line.stock === 1 ? '' : 's'} available in stock.`
  }
  return null
}

export function hasUnavailableCartItems(lines: CartLine[]): boolean {
  return lines.some((line) => !isCartLineSelectable(line))
}

const CHECKOUT_CART_IDS_KEY = 'mednexus:checkout-cart-ids'

export function saveCheckoutCartIds(ids: string[]): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(CHECKOUT_CART_IDS_KEY, JSON.stringify(ids))
}

export function readCheckoutCartIds(): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = sessionStorage.getItem(CHECKOUT_CART_IDS_KEY)
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

export function clearCheckoutCartIds(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(CHECKOUT_CART_IDS_KEY)
}
