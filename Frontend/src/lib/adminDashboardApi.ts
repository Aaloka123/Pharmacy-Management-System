import { api } from './api'

export type AdminDashboardStats = {
  totalUsers: number
  activeVendors: number
  pendingVendors: number
  totalOrders: number
  ordersThisWeek: number
  platformRevenue: number
  totalProducts: number
  ordersChangeLabel: string
  revenueChangeLabel: string
}

export type AdminChartMonthPoint = {
  label: string
  value: number
}

export type AdminVendorStatusSlice = {
  label: string
  count: number
  color: string
}

export type AdminPendingVendorItem = {
  id: number
  businessName: string
  ownerName: string
  city: string
  appliedAt: string
}

export type AdminTopVendorItem = {
  vendorId: number
  businessName: string
  profileImage: string | null
  orderCount: number
  revenue: number
  averageRating: number | null
}

export type AdminRecentActivityItem = {
  action: string
  detail: string
  occurredAt: string
  tone: string
}

export type AdminDashboardData = {
  stats: AdminDashboardStats
  charts: {
    revenueByMonth: AdminChartMonthPoint[]
    ordersByMonth: AdminChartMonthPoint[]
    vendorStatusBreakdown: AdminVendorStatusSlice[]
  }
  pendingVendors: AdminPendingVendorItem[]
  topVendors: AdminTopVendorItem[]
  recentActivity: AdminRecentActivityItem[]
}

export async function fetchAdminDashboard(): Promise<AdminDashboardData> {
  const { data } = await api.get<AdminDashboardData>('/api/admin/dashboard')
  return {
    ...data,
    stats: {
      ...data.stats,
      platformRevenue: Number(data.stats.platformRevenue),
    },
    topVendors: data.topVendors.map((vendor) => ({
      ...vendor,
      revenue: Number(vendor.revenue),
    })),
  }
}

export function formatNpr(amount: number): string {
  return `NPR ${Math.round(amount).toLocaleString()}`
}

export function formatPlatformRevenue(amount: number): string {
  if (amount >= 10_000_000) {
    return `NPR ${(amount / 10_000_000).toFixed(2)} Cr`
  }
  if (amount >= 100_000) {
    return `NPR ${(amount / 100_000).toFixed(2)} L`
  }
  return formatNpr(amount)
}

export function formatTimeAgo(iso: string): string {
  const timestamp = new Date(iso).getTime()
  if (Number.isNaN(timestamp)) return 'recently'
  const diffMs = Date.now() - timestamp
  const minutes = Math.floor(diffMs / 60_000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}
