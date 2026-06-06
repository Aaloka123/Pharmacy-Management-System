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

export async function addToCart(input: { productId: number; quantity?: number }): Promise<void> {
  if (!isCartUserLoggedIn()) {
    throw new CartAuthRequiredError()
  }
  await addProductToCart(input.productId, input.quantity ?? 1)
}

export function isCartApiError(error: unknown): error is ApiRequestError {
  return error instanceof ApiRequestError
}
