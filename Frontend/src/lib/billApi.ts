import { api } from './api'
import type { ApiPaymentMethod } from './orderApi'

export type ApiBillStatus = 'UNPAID' | 'PAID' | 'PARTIALLY_PAID'

export type BillLineDto = {
  id: number
  productName: string
  description: string | null
  quantity: number
  unitPrice: number
  lineAmount: number
  sortOrder: number
}

export type BillDto = {
  id: number
  invoiceNumber: string
  invoiceDate: string
  dueDate: string | null
  paymentTerms: string | null
  paymentMethod: ApiPaymentMethod
  status: ApiBillStatus
  billToName: string
  billToEmail: string | null
  billToPhone: string | null
  billToAddress: string | null
  vendorBusinessName: string
  vendorPanVatId: string | null
  vendorBusinessLocation: string | null
  vendorPhone: string | null
  vendorEmail: string | null
  subtotal: number
  taxPercent: number
  taxAmount: number
  discountPercent: number
  discountAmount: number
  totalAmount: number
  createdAt: string
  lines: BillLineDto[]
}

export type CreateBillLinePayload = {
  productName: string
  description?: string
  quantity: number
  unitPrice: number
}

export type CreateBillPayload = {
  invoiceNumber?: string
  invoiceDate: string
  dueDate?: string
  paymentTerms?: string
  paymentMethod: ApiPaymentMethod
  status: ApiBillStatus
  billToName: string
  billToEmail?: string
  billToPhone?: string
  billToAddress?: string
  discountPercent: number
  lines: CreateBillLinePayload[]
}

export async function fetchVendorBills(): Promise<BillDto[]> {
  const { data } = await api.get<BillDto[]>('/api/vendor/bills')
  return data
}

export async function fetchVendorBill(billId: number): Promise<BillDto> {
  const { data } = await api.get<BillDto>(`/api/vendor/bills/${billId}`)
  return data
}

export async function createVendorBill(payload: CreateBillPayload): Promise<BillDto> {
  const { data } = await api.post<BillDto>('/api/vendor/bills', payload)
  return data
}

export async function deleteVendorBill(billId: number): Promise<void> {
  await api.delete(`/api/vendor/bills/${billId}`)
}

export function toApiPaymentMethod(method: 'e-sewa' | 'khalti' | 'COD'): ApiPaymentMethod {
  if (method === 'e-sewa') return 'ESEWA'
  if (method === 'khalti') return 'KHALTI'
  return 'COD'
}

export function fromApiPaymentMethod(method: ApiPaymentMethod): 'e-sewa' | 'khalti' | 'COD' {
  if (method === 'ESEWA') return 'e-sewa'
  if (method === 'KHALTI') return 'khalti'
  return 'COD'
}

export function toApiBillStatus(status: 'Unpaid' | 'Paid' | 'Partially Paid'): ApiBillStatus {
  if (status === 'Paid') return 'PAID'
  if (status === 'Partially Paid') return 'PARTIALLY_PAID'
  return 'UNPAID'
}

export function fromApiBillStatus(status: ApiBillStatus): 'Unpaid' | 'Paid' | 'Partially Paid' {
  if (status === 'PAID') return 'Paid'
  if (status === 'PARTIALLY_PAID') return 'Partially Paid'
  return 'Unpaid'
}
