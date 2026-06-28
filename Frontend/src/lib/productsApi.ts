import { api, resolveMediaUrl } from './api'

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
  const seen = new Set<string>()
  for (const file of imageFiles) {
    const key = `${file.name}:${file.size}:${file.lastModified}`
    if (seen.has(key)) continue
    seen.add(key)
    formData.append('images', file)
  }
  return formData
}

export function toStoredImageReference(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed || trimmed.startsWith('blob:') || trimmed.startsWith('data:')) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  const uploadsIndex = trimmed.indexOf('/uploads/')
  if (uploadsIndex >= 0) return trimmed.slice(uploadsIndex)
  if (trimmed.startsWith('/uploads/')) return trimmed
  return null
}

export function getStoredImageReferences(images: string[]): string[] {
  return images.map(toStoredImageReference).filter((url): url is string => url != null)
}

/** Returns a display URL for the best stored product image (prefers latest Cloudinary URL). */
export function getFirstProductImageUrl(images: string[] | null | undefined): string | null {
  if (!images?.length) return null
  for (let i = images.length - 1; i >= 0; i -= 1) {
    const raw = images[i]
    if (/^https?:\/\//i.test(raw.trim()) && raw.includes('res.cloudinary.com')) {
      const url = resolveMediaUrl(raw)
      if (url) return url
    }
  }
  for (const raw of images) {
    const url = resolveMediaUrl(raw)
    if (url) return url
  }
  return null
}

export function getProductImageUrls(images: string[] | null | undefined): string[] {
  if (!images?.length) return []
  return images
    .map((raw) => resolveMediaUrl(raw))
    .filter((url): url is string => url != null)
}

export function listPublicProducts(category?: string) {
  const query =
    category && category !== 'All Medications'
      ? `?category=${encodeURIComponent(category)}`
      : ''
  return api.get<ProductDto[]>(`/api/products${query}`)
}

/** Latest active catalog products from approved vendors (newest first). */
export function listNewArrivalsProducts(limit = 4) {
  return api.get<ProductDto[]>(`/api/products/new-arrivals?limit=${limit}`)
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

export function updateVendorProductJson(id: number, payload: ProductWritePayload) {
  return api.put<ProductDto>(`/api/vendors/me/products/${id}`, payload)
}

export function updateVendorProductStatus(id: number, status: ProductStatus) {
  return api.patch<ProductDto>(`/api/vendors/me/products/${id}/status`, { status })
}

export function deleteVendorProduct(id: number) {
  return api.delete(`/api/vendors/me/products/${id}`)
}
