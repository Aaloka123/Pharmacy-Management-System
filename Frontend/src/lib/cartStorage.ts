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
