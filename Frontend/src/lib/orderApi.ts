import { api } from './api'

export type ApiPaymentMethod = 'COD' | 'ESEWA' | 'KHALTI'
export type ApiOrderStatus = 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELED'

export type VendorOrderDto = {
  id: number
  clientName: string
  email: string
  phone: string
  location: string
  vendorName: string
  productName: string
  productSku: string
  productImage: string | null
  unitPrice: number
  quantity: number
  paymentMethod: ApiPaymentMethod
  orderDate: string
  status: ApiOrderStatus
}

export type PlaceOrderPayload = {
  paymentMethod: ApiPaymentMethod
  cartItemIds: number[]
}

export async function placeOrder(payload: PlaceOrderPayload): Promise<VendorOrderDto[]> {
  const { data } = await api.post<VendorOrderDto[]>('/api/orders', payload)
  return data
}

export async function fetchMyOrders(): Promise<VendorOrderDto[]> {
  const { data } = await api.get<VendorOrderDto[]>('/api/orders')
  return data
}

export async function fetchUserOrders(userId: number): Promise<VendorOrderDto[]> {
  const { data } = await api.get<VendorOrderDto[]>(`/api/users/${userId}/orders`)
  return data
}

export async function cancelOrder(orderId: number): Promise<VendorOrderDto> {
  const { data } = await api.post<VendorOrderDto>(`/api/orders/${orderId}/cancel`)
  return data
}

export function canUserCancelOrder(status: ApiOrderStatus): boolean {
  return status === 'PENDING' || status === 'CONFIRMED'
}

export async function fetchVendorOrders(): Promise<VendorOrderDto[]> {
  const { data } = await api.get<VendorOrderDto[]>('/api/vendor/orders')
  return data
}

export async function updateVendorOrderStatus(orderId: number, status: ApiOrderStatus): Promise<VendorOrderDto> {
  const { data } = await api.patch<VendorOrderDto>(`/api/vendor/orders/${orderId}/status`, { status })
  return data
}

export function toApiPaymentMethod(method: 'cod' | 'esewa' | 'khalti'): ApiPaymentMethod {
  if (method === 'esewa') return 'ESEWA'
  if (method === 'khalti') return 'KHALTI'
  return 'COD'
}
