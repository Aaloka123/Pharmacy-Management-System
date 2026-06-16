import { api } from './api'
import type { ProductDto } from './productsApi'
import { listPublicProducts } from './productsApi'

export type ApiStoreStatus = 'OPEN' | 'CLOSED'

export type PublicVendorDto = {
  id: number
  name: string
  businessName: string
  businessLocation: string
  location: string
  phoneNumber: string
  email: string
  pharmacyLicense: string
  profileImage: string | null
  storeStatus: ApiStoreStatus
  createdAt: string
}

export function toDisplayStoreStatus(status: ApiStoreStatus): 'Open' | 'Close' {
  return status === 'OPEN' ? 'Open' : 'Close'
}

export function toApiStoreStatus(status: 'Open' | 'Close'): ApiStoreStatus {
  return status === 'Open' ? 'OPEN' : 'CLOSED'
}

export function updateVendorStoreStatus(vendorId: number, storeStatus: ApiStoreStatus) {
  return api.put<{ storeStatus: ApiStoreStatus; storeLockedByAdmin: boolean }>(
    `/api/vendors/${vendorId}/store-status`,
    { storeStatus },
  )
}

function filterProductsForVendor(products: ProductDto[], vendorId: number) {
  return products.filter((product) => product.vendorId === vendorId)
}

export async function getPublicVendor(vendorId: number) {
  try {
    return await api.get<PublicVendorDto>(`/api/public/vendors/${vendorId}`)
  } catch {
    return api.get<PublicVendorDto>(`/api/vendors/${vendorId}/public`)
  }
}

export function listPublicVendors() {
  return api.get<PublicVendorDto[]>('/api/public/vendors')
}

export async function listPublicVendorProducts(vendorId: number) {
  try {
    const response = await api.get<ProductDto[]>(`/api/products?vendorId=${vendorId}`)
    const filtered = filterProductsForVendor(response.data, vendorId)
    if (filtered.length > 0 || response.data.length === 0) {
      return { data: filtered }
    }
  } catch {
    // try next endpoint
  }

  try {
    const response = await api.get<ProductDto[]>(`/api/products/by-vendor/${vendorId}`)
    return { data: filterProductsForVendor(response.data, vendorId) }
  } catch {
    // fall back to full catalog filtered by vendor
  }

  const catalog = await listPublicProducts()
  return { data: filterProductsForVendor(catalog.data, vendorId) }
}
