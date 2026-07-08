import { api, resolveBackendUrl } from './api'
import type { CartLine } from './cartStorage'

export type CartItemDto = {
  id: number
  productId: number
  productName: string
  category: string
  form: string
  strength: string
  pack: string
  unitPrice: number
  image: string | null
  qty: number
  stock: number
  vendorName: string
  vendorStoreOpen: boolean
  productActive: boolean
}

export function mapCartItemToLine(item: CartItemDto): CartLine {
  const subtitle = `${item.category} · ${item.form}`
  const image = item.image ? resolveBackendUrl(item.image) : ''
  return {
    id: String(item.id),
    productId: item.productId,
    name: item.productName,
    subtitle,
    strength: item.strength,
    form: item.form,
    pack: item.pack,
    unitPrice: Number(item.unitPrice),
    image,
    qty: item.qty,
    stock: item.stock,
    vendorName: item.vendorName ?? 'Vendor',
    vendorStoreOpen: item.vendorStoreOpen ?? true,
    productActive: item.productActive ?? true,
  }
}

export async function fetchCart(): Promise<CartLine[]> {
  const { data } = await api.get<CartItemDto[]>('/api/cart')
  return data.map(mapCartItemToLine)
}

export async function addProductToCart(productId: number, quantity = 1): Promise<CartLine> {
  const { data } = await api.post<CartItemDto>('/api/cart', { productId, quantity })
  return mapCartItemToLine(data)
}

export async function updateCartItemQuantity(cartItemId: number, quantity: number): Promise<CartLine> {
  const { data } = await api.patch<CartItemDto>(`/api/cart/${cartItemId}`, { quantity })
  return mapCartItemToLine(data)
}

export async function removeCartItem(cartItemId: number): Promise<void> {
  await api.delete(`/api/cart/${cartItemId}`)
}

export async function removeCartItems(cartItemIds: number[]): Promise<void> {
  if (cartItemIds.length === 0) return
  await api.post<void>('/api/cart/remove', { ids: cartItemIds })
}
