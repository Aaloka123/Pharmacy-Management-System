import { api } from './api'

export const PENDING_VENDORS_URL = '/api/vendors?status=PENDING'
export const PENDING_VENDORS_EVENT = 'mednexus:pending-vendors-changed'

const SEEN_PENDING_VENDORS_KEY = 'adminSeenPendingVendorIds'

export type AdminVendorRequestNotification = {
  id: number
  businessName: string
  name: string
  email: string
  createdAt: string
}

type PendingVendorDto = {
  id: number
  name: string
  email: string
  businessName: string
  createdAt: string
}

function readSeenIds(): Set<number> {
  try {
    const raw = localStorage.getItem(SEEN_PENDING_VENDORS_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as number[]
    return new Set(parsed.filter((id) => Number.isFinite(id)))
  } catch {
    return new Set()
  }
}

function writeSeenIds(ids: number[]) {
  localStorage.setItem(SEEN_PENDING_VENDORS_KEY, JSON.stringify(ids))
}

export function formatSubmittedAgo(iso: string): string {
  const submittedAt = new Date(iso).getTime()
  if (Number.isNaN(submittedAt)) return 'recently'
  const diffMs = Date.now() - submittedAt
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export async function fetchPendingVendorNotifications(): Promise<AdminVendorRequestNotification[]> {
  const { data } = await api.get<PendingVendorDto[]>(PENDING_VENDORS_URL)
  return data.map((vendor) => ({
    id: vendor.id,
    businessName: vendor.businessName?.trim() || vendor.name?.trim() || 'Vendor',
    name: vendor.name,
    email: vendor.email,
    createdAt: vendor.createdAt,
  }))
}

export function countUnreadPendingVendors(notifications: AdminVendorRequestNotification[]): number {
  const seen = readSeenIds()
  return notifications.filter((notification) => !seen.has(notification.id)).length
}

export function isPendingVendorUnread(vendorId: number): boolean {
  return !readSeenIds().has(vendorId)
}

export function markPendingVendorSeen(vendorId: number) {
  const seen = readSeenIds()
  seen.add(vendorId)
  writeSeenIds([...seen])
  window.dispatchEvent(new Event(PENDING_VENDORS_EVENT))
}

export function markAllPendingVendorsSeen(vendorIds: number[]) {
  writeSeenIds(vendorIds)
  window.dispatchEvent(new Event(PENDING_VENDORS_EVENT))
}

export function refreshAdminNotifications() {
  window.dispatchEvent(new Event(PENDING_VENDORS_EVENT))
}
