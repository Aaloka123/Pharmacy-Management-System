import { api, resolveBackendUrl } from './api'

export type AdminProductProfitItem = {
  productId: number
  productName: string
  productSku: string
  productImage: string | null
  vendorId: number
  vendorBusinessName: string
  unitPrice: number
  quantitySold: number
  totalSales: number
  adminProfit: number
  firstSoldAt: string
}

export type AdminProfitData = {
  totalAdminProfit: number
  periodLabel: string
  products: AdminProductProfitItem[]
}

export type AdminProfitQuery =
  | { allHistory: true }
  | { year: number; month: number }

export async function fetchAdminProfit(query: AdminProfitQuery): Promise<AdminProfitData> {
  const path =
    'allHistory' in query && query.allHistory
      ? '/api/admin/profit?all=true'
      : `/api/admin/profit?year=${query.year}&month=${query.month}`
  const { data } = await api.get<AdminProfitData>(path)
  return {
    totalAdminProfit: Number(data.totalAdminProfit),
    periodLabel: data.periodLabel,
    products: data.products.map((product) => ({
      ...product,
      unitPrice: Number(product.unitPrice),
      quantitySold: Number(product.quantitySold),
      totalSales: Number(product.totalSales),
      adminProfit: Number(product.adminProfit),
      productImage: product.productImage ? resolveBackendUrl(product.productImage) : null,
    })),
  }
}

export function formatNpr(amount: number): string {
  return `NPR ${Math.round(amount).toLocaleString()}`
}

export type AdminProfitPeriodOption = {
  value: string
  label: string
  query: AdminProfitQuery
}

export type AdminProfitMonthCell = AdminProfitPeriodOption & {
  month: number
  shortLabel: string
  isCurrent: boolean
}

export type AdminProfitPeriodGroups = {
  allHistory: AdminProfitPeriodOption
  years: Array<{
    year: number
    months: AdminProfitMonthCell[]
  }>
}

const MONTH_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] as const

export function buildAdminProfitPeriodOptions(count = 12): AdminProfitPeriodOption[] {
  const groups = buildAdminProfitPeriodGroups(count)
  return [groups.allHistory, ...groups.years.flatMap((yearGroup) => yearGroup.months)]
}

export function buildAdminProfitPeriodGroups(count = 12): AdminProfitPeriodGroups {
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth() + 1

  const allHistory: AdminProfitPeriodOption = {
    value: 'all',
    label: 'All history',
    query: { allHistory: true },
  }

  const availableByYear = new Map<number, Map<number, AdminProfitMonthCell>>()

  for (let index = 0; index < count; index += 1) {
    const date = new Date(now.getFullYear(), now.getMonth() - index, 1)
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    const value = `${year}-${String(month).padStart(2, '0')}`

    const cell: AdminProfitMonthCell = {
      value,
      label: date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }),
      query: { year, month },
      month,
      shortLabel: MONTH_SHORT[month - 1],
      isCurrent: year === currentYear && month === currentMonth,
    }

    if (!availableByYear.has(year)) {
      availableByYear.set(year, new Map())
    }
    availableByYear.get(year)!.set(month, cell)
  }

  const years = [...availableByYear.keys()]
    .sort((a, b) => b - a)
    .map((year) => {
      const monthMap = availableByYear.get(year)!
      const months = [...monthMap.values()].sort((a, b) => b.month - a.month)
      return { year, months }
    })

  return { allHistory, years }
}
