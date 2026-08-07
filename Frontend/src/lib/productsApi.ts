/**
 * Product API helpers.
 * Pages call these functions; they talk to the Spring Boot backend via `api`.
 */
import { api, resolveMediaUrl } from './api'

/** Matches backend ProductStatus enum. */
export type ProductStatus = 'ACTIVE' | 'INACTIVE'

/** Medicine categories shown in the vendor add-product dropdown. */
export const MEDICINE_CATEGORIES = [
  'Analgesics & Antipyretics',
  'Antibiotics',
  'Antacids & Gastrointestinal',
  'Antihistamines & Allergy',
  'Antidiabetics',
  'Cardiovascular',
  'Respiratory & Asthma',
  'Cold & Flu',
  'Vitamins & Supplements',
  'Dermatological',
  'Ophthalmic (Eye Care)',
  'ENT (Ear, Nose & Throat)',
  'Antifungal',
  'Antiviral',
  'Neurological & CNS',
  'Hormones & Steroids',
  "Women's Health",
  'Pediatric Care',
  'First Aid & Wound Care',
  'Antiseptics & Disinfectants',
  'Oral Care',
  'OTC / General Medicine',
] as const

/**
 * Product data returned by the backend (same shape as ProductResponse).
 * Used when listing or loading a product.
 */
export type ProductDto = {
  id: number
  vendorId: number
  vendorBusinessName: string
  vendorBusinessLocation: string | null
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
  prescriptionRequired: boolean
  images: string[]
  createdAt: string
  updatedAt: string
}

/** Shows strength with mg when the value is only a number (e.g. "500" → "500mg"). */
export function formatStrength(strength: string | null | undefined): string {
  const trimmed = (strength ?? '').trim()
  if (!trimmed) return trimmed
  if (/[a-zA-Z%]/.test(trimmed)) return trimmed
  if (/^\d+(\.\d+)?$/.test(trimmed)) return `${trimmed}mg`
  return trimmed
}

/**
 * Data sent when creating or updating a product (same idea as ProductWriteRequest).
 * Does not include id — backend creates or updates that.
 */
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
  prescriptionRequired: boolean
  existingImages?: string[]
}

/**
 * Builds multipart form data for create/update with images.
 * - "product" = JSON fields
 * - "images"  = uploaded files
 */
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

/** Keeps only real stored image URLs (skips temporary blob/data preview URLs). */
export function toStoredImageReference(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed || trimmed.startsWith('blob:') || trimmed.startsWith('data:')) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  const uploadsIndex = trimmed.indexOf('/uploads/')
  if (uploadsIndex >= 0) return trimmed.slice(uploadsIndex)
  if (trimmed.startsWith('/uploads/')) return trimmed
  return null
}

/** Filters a list of image URLs down to ones safe to send back to the backend. */
export function getStoredImageReferences(images: string[]): string[] {
  return images.map(toStoredImageReference).filter((url): url is string => url != null)
}

/** Best image URL for display (prefers Cloudinary if present). */
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

/** All displayable image URLs for a product. */
export function getProductImageUrls(images: string[] | null | undefined): string[] {
  if (!images?.length) return []
  return images
    .map((raw) => resolveMediaUrl(raw))
    .filter((url): url is string => url != null)
}

// --- Backend API calls (HTTP) ---

/** Public shop catalog. Optional category filter. */
export function listPublicProducts(category?: string) {
  const query =
    category && category !== 'All Medications'
      ? `?category=${encodeURIComponent(category)}`
      : ''
  return api.get<ProductDto[]>(`/api/products${query}`)
}

/** Newest active products for home/new-arrivals sections. */
export function listNewArrivalsProducts(limit = 4) {
  return api.get<ProductDto[]>(`/api/products/new-arrivals?limit=${limit}`)
}

/** Single public product by id (product detail page). */
export function getPublicProduct(id: number) {
  return api.get<ProductDto>(`/api/products/${id}`)
}

/** Logged-in vendor's own products. */
export function listVendorProducts() {
  return api.get<ProductDto[]>('/api/vendors/me/products')
}

/** Products for one vendor (admin or public vendor profile). */
export function listVendorProductsByVendorId(vendorId: number) {
  return api.get<ProductDto[]>(`/api/vendors/${vendorId}/products`)
}

/** All products for admin product list. */
export function listAdminProducts() {
  return api.get<ProductDto[]>('/api/admin/products')
}

/** Create product with images (multipart). */
export function createVendorProduct(formData: FormData) {
  return api.post<ProductDto>('/api/vendors/me/products', formData)
}

/** Update product with possible new images (multipart). */
export function updateVendorProduct(id: number, formData: FormData) {
  return api.put<ProductDto>(`/api/vendors/me/products/${id}`, formData)
}

/** Update product fields only (JSON, no new image files). */
export function updateVendorProductJson(id: number, payload: ProductWritePayload) {
  return api.put<ProductDto>(`/api/vendors/me/products/${id}`, payload)
}

/** Toggle Active/Inactive only (matches UpdateProductStatusRequest). */
export function updateVendorProductStatus(id: number, status: ProductStatus) {
  return api.patch<ProductDto>(`/api/vendors/me/products/${id}/status`, { status })
}

/** Delete a vendor product. */
export function deleteVendorProduct(id: number) {
  return api.delete(`/api/vendors/me/products/${id}`)
}
