import { api } from './api'

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

export function listPublicProducts(category?: string) {
  const query =
    category && category !== 'All Medications'
      ? `?category=${encodeURIComponent(category)}`
      : ''
  return api.get<ProductDto[]>(`/api/products${query}`)
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
