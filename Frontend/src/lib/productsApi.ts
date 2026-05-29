import { api, resolveBackendUrl } from './api'

export type ProductStatus = 'ACTIVE' | 'INACTIVE'

export type ProductDto = {
  id: number
  vendorId: number
  vendorBusinessName: string
  productName: string
  sku: string
  category: string
  strength: string
  form: string
  quantity: string
  storageRequirements: string
  expiryDate: string
  productDescription: string
  dosageInstructions: string[]
  sideEffects: string[]
  price: number
  stock: number
  status: ProductStatus
  images: string[]
  createdAt: string
  updatedAt: string
}

export type ProductWritePayload = {
  productName: string
  sku: string
  category: string
  strength: string
  form: string
  quantity: string
  storageRequirements: string
  expiryDate: string
  productDescription: string
  dosageInstructions: string[]
  sideEffects: string[]
  price: number
  stock: number
  status: ProductStatus
  existingImages?: string[]
}

export function buildProductFormData(payload: ProductWritePayload, imageFiles: File[]): FormData {
  const formData = new FormData()
  formData.append(
    'product',
    new Blob([JSON.stringify(payload)], { type: 'application/json' }),
  )
  imageFiles.forEach((file) => formData.append('images', file))
  return formData
}

/** Returns a display URL only when the product has a stored upload path. */
export function getFirstProductImageUrl(images: string[] | null | undefined): string | null {
  if (!images?.length) return null
  for (const raw of images) {
    const trimmed = raw?.trim()
    if (!trimmed || trimmed.startsWith('blob:') || trimmed.startsWith('data:')) continue
    const uploadsIndex = trimmed.indexOf('/uploads/')
    if (uploadsIndex < 0) continue
    const path = trimmed.slice(uploadsIndex)
    return resolveBackendUrl(path)
  }
  return null
}

export function getProductImageUrls(images: string[] | null | undefined): string[] {
  if (!images?.length) return []
  return images
    .map((raw) => {
      const trimmed = raw?.trim()
      if (!trimmed || trimmed.startsWith('blob:') || trimmed.startsWith('data:')) return null
      const uploadsIndex = trimmed.indexOf('/uploads/')
      if (uploadsIndex < 0) return null
      return resolveBackendUrl(trimmed.slice(uploadsIndex))
    })
    .filter((url): url is string => url != null)
}

export function listPublicProducts(category?: string) {
  const query =
    category && category !== 'All Medications'
      ? `?category=${encodeURIComponent(category)}`
      : ''
  return api.get<ProductDto[]>(`/api/products${query}`)
}

export function getPublicProduct(id: number) {
  return api.get<ProductDto>(`/api/products/${id}`)
}

export function listVendorProducts() {
  return api.get<ProductDto[]>('/api/vendors/me/products')
}

export function listVendorProductsByVendorId(vendorId: number) {
  return api.get<ProductDto[]>(`/api/vendors/${vendorId}/products`)
}

export function createVendorProduct(formData: FormData) {
  return api.post<ProductDto>('/api/vendors/me/products', formData)
}

export function updateVendorProduct(id: number, formData: FormData) {
  return api.put<ProductDto>(`/api/vendors/me/products/${id}`, formData)
}

export function deleteVendorProduct(id: number) {
  return api.delete(`/api/vendors/me/products/${id}`)
}
