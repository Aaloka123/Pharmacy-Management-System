import { api } from './api'
import type { ApiOrderStatus, ApiPaymentMethod, VendorOrderDto } from './orderApi'

export type VendorDashboardStats = {
  totalRevenue: number
  revenueChangeLabel: string
  totalOrders: number
  ordersThisWeek: number
  ordersChangeLabel: string
  activeProducts: number
  lowStockCount: number
  averageRating: number | null
  totalReviews: number
}

export type VendorChartPoint = {
  label: string
  value: number
}

export type VendorStatusSlice = {
  label: string
  count: number
  color: string
}

export type VendorPaymentSlice = {
  label: string
  pct: number
}

export type VendorTopProductItem = {
  productId: number
  name: string
  sold: number
  revenue: number
  imageUrl: string | null
}

export type VendorDashboardData = {
  stats: VendorDashboardStats
  charts: {
    revenueByMonth: VendorChartPoint[]
    ordersByDay: VendorChartPoint[]
    orderStatusBreakdown: VendorStatusSlice[]
    paymentMethodSplit: VendorPaymentSlice[]
    topSellingDayLabel: string
  }
  recentOrders: VendorOrderDto[]
  topProducts: VendorTopProductItem[]
  unreadMessages: number
}

type VendorDashboardApiResponse = Omit<VendorDashboardData, 'stats' | 'topProducts'> & {
  stats: Omit<VendorDashboardStats, 'totalRevenue'> & { totalRevenue: number | string }
  topProducts: (Omit<VendorTopProductItem, 'revenue'> & { revenue: number | string })[]
  recentOrders: (Omit<VendorOrderDto, 'orderDate'> & { orderDate: string })[]
}

export async function fetchVendorDashboard(): Promise<VendorDashboardData> {
  const { data } = await api.get<VendorDashboardApiResponse>('/api/vendor/dashboard')
  return {
    ...data,
    stats: {
      ...data.stats,
      totalRevenue: Number(data.stats.totalRevenue),
    },
    topProducts: data.topProducts.map((product) => ({
      ...product,
      revenue: Number(product.revenue),
    })),
    recentOrders: data.recentOrders.map((order) => ({
      ...order,
      orderDate: order.orderDate,
    })),
  }
}

export function formatNpr(amount: number): string {
  return `NPR ${Math.round(amount).toLocaleString()}`
}

export function formatVendorRevenue(amount: number): string {
  if (amount >= 10_000_000) {
    return `NPR ${(amount / 10_000_000).toFixed(2)} Cr`
  }
  if (amount >= 100_000) {
    return `NPR ${(amount / 100_000).toFixed(2)} L`
  }
  return formatNpr(amount)
}

export function formatOrderStatus(status: ApiOrderStatus): string {
  return status.charAt(0) + status.slice(1).toLowerCase()
}

export function formatPaymentMethod(method: ApiPaymentMethod): string {
  if (method === 'ESEWA') return 'eSewa'
  if (method === 'KHALTI') return 'Khalti'
  return 'COD'
}

export function formatOrderDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export function orderLineTotal(order: VendorOrderDto): number {
  return Number(order.unitPrice) * order.quantity
}
