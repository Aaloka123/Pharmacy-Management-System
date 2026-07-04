import {
  LuArrowDownRight,
  LuArrowUpRight,
  LuCircleDollarSign,
  LuPackage,
  LuShoppingBag,
  LuStar,
  LuTrendingUp,
} from 'react-icons/lu'
import { useEffect, useMemo, useState, type ComponentType } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../VendorComponents/Navbar'
import VendorNotificationBell from '../VendorComponents/VendorNotificationBell'
import { VendorLayout, VendorMain, FadeInOnScroll } from '../components/PortalMain'
import { getStoredUser } from '../lib/auth'
import { resolveMediaUrl } from '../lib/api'
import {
  fetchVendorDashboard,
  formatNpr,
  formatOrderDate,
  formatOrderStatus,
  formatVendorRevenue,
  orderLineTotal,
  type VendorChartPoint,
  type VendorDashboardData,
  type VendorStatusSlice,
} from '../lib/vendorDashboardApi'

type StatCard = {
  label: string
  value: string
  change: string
  up: boolean
  sub: string
  icon: ComponentType<{ className?: string; strokeWidth?: number }>
  accent: string
}

const statusTone: Record<string, string> = {
  Delivered: 'bg-emerald-100 text-emerald-800',
  Shipped: 'bg-sky-100 text-sky-800',
  Confirmed: 'bg-indigo-100 text-indigo-800',
  Pending: 'bg-amber-100 text-amber-800',
  Canceled: 'bg-rose-100 text-rose-800',
}

function RevenueChart({ months }: { months: VendorChartPoint[] }) {
  if (months.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-slate-500">No revenue data yet.</div>
    )
  }

  const width = 640
  const height = 220
  const padX = 36
  const padY = 24
  const max = Math.max(...months.map((m) => m.value), 1)
  const points = months.map((m, i) => {
    const x = padX + (i / Math.max(months.length - 1, 1)) * (width - padX * 2)
    const y = height - padY - (m.value / max) * (height - padY * 2)
    return { x, y, ...m }
  })
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const lastPoint = points[points.length - 1]
  const firstPoint = points[0]
  const areaPath = `${linePath} L ${lastPoint.x} ${height - padY} L ${firstPoint.x} ${height - padY} Z`

  return (
    <svg aria-hidden className="h-full w-full" viewBox={`0 0 ${width} ${height}`}>
      {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
        const y = height - padY - tick * (height - padY * 2)
        return (
          <line key={tick} stroke="#e2e8f0" strokeDasharray="4 4" x1={padX} x2={width - padX} y1={y} y2={y} />
        )
      })}
      <defs>
        <linearGradient id="vendorRevenueFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#0d9488" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#0d9488" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#vendorRevenueFill)" />
      <path d={linePath} fill="none" stroke="#0f766e" strokeLinecap="round" strokeWidth="2.5" />
      {points.map((p) => (
        <g key={p.label}>
          <circle cx={p.x} cy={p.y} fill="#fff" r="4" stroke="#0f766e" strokeWidth="2" />
          <text fill="#64748b" fontSize="10" textAnchor="middle" x={p.x} y={height - 6}>
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  )
}

function OrderStatusDonut({ slices }: { slices: VendorStatusSlice[] }) {
  const total = slices.reduce((sum, slice) => sum + slice.count, 0)
  let offset = 0
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const denominator = total > 0 ? total : 1

  if (total === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-slate-500">No orders yet.</div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative h-40 w-40 shrink-0">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 140 140">
          <circle cx="70" cy="70" fill="none" r={radius} stroke="#f1f5f9" strokeWidth="16" />
          {slices.map((slice) => {
            const dash = (slice.count / denominator) * circumference
            const circle = (
              <circle
                key={slice.label}
                cx="70"
                cy="70"
                fill="none"
                r={radius}
                stroke={slice.color}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                strokeWidth="16"
              />
            )
            offset += dash
            return circle
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <p className="text-2xl font-bold text-slate-900">{total}</p>
          <p className="text-xs text-slate-500">Orders</p>
        </div>
      </div>
      <ul className="w-full space-y-2.5 sm:max-w-[180px]">
        {slices.map((slice) => (
          <li className="flex items-center justify-between gap-3 text-sm" key={slice.label}>
            <span className="flex items-center gap-2 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
              {slice.label}
            </span>
            <span className="font-semibold text-slate-900">{slice.count}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function TopProductImage({ imageUrl, name }: { imageUrl: string | null; name: string }) {
  const src = resolveMediaUrl(imageUrl)
  const initial = (name.trim().charAt(0) || '?').toUpperCase()

  if (src) {
    return (
      <img
        alt=""
        className="h-10 w-10 shrink-0 rounded-lg border border-slate-200 bg-white object-cover"
        src={src}
      />
    )
  }

  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-100 text-sm font-bold text-slate-500">
      {initial}
    </span>
  )
}

const VendorDashboard = () => {
  const vendorName = getStoredUser()?.fullName?.trim() || 'Vendor'
  const [dashboard, setDashboard] = useState<VendorDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      setLoading(true)
      setError(null)
      try {
        setDashboard(await fetchVendorDashboard())
      } catch {
        setError('Could not load dashboard data.')
        setDashboard(null)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const statCards = useMemo<StatCard[]>(() => {
    if (!dashboard) return []
    const { stats } = dashboard
    const revenueUp = !stats.revenueChangeLabel.startsWith('-')
    const ordersUp = !stats.ordersChangeLabel.startsWith('-')

    return [
      {
        label: 'Total Revenue',
        value: formatVendorRevenue(stats.totalRevenue),
        change: stats.revenueChangeLabel,
        up: revenueUp,
        sub: 'vs last month',
        icon: LuCircleDollarSign,
        accent: 'bg-emerald-50 text-emerald-700',
      },
      {
        label: 'Total Orders',
        value: stats.totalOrders.toLocaleString(),
        change: stats.ordersChangeLabel,
        up: ordersUp,
        sub: `${stats.ordersThisWeek} this week`,
        icon: LuShoppingBag,
        accent: 'bg-sky-50 text-sky-700',
      },
      {
        label: 'Active Products',
        value: stats.activeProducts.toLocaleString(),
        change: stats.lowStockCount > 0 ? `${stats.lowStockCount} low stock` : 'Healthy',
        up: stats.lowStockCount === 0,
        sub: 'Active listings',
        icon: LuPackage,
        accent: 'bg-violet-50 text-violet-700',
      },
      {
        label: 'Average Rating',
        value: stats.averageRating != null ? stats.averageRating.toFixed(1) : '—',
        change: stats.totalReviews > 0 ? `${stats.totalReviews} reviews` : 'No reviews',
        up: true,
        sub: 'Customer feedback',
        icon: LuStar,
        accent: 'bg-amber-50 text-amber-700',
      },
    ]
  }, [dashboard])

  const currentYear = new Date().getFullYear()

  return (
    <VendorLayout>
      <Navbar />
      <VendorMain className="flex-1 overflow-y-auto p-6 lg:p-8">
        <FadeInOnScroll>
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-teal-700">Vendor Portal</p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
              <p className="mt-1 text-sm text-slate-600">
                Welcome back, <span className="font-medium text-slate-800">{vendorName}</span>. Here is your pharmacy
                performance overview.
              </p>
            </div>
            <div className="flex shrink-0 items-center justify-end gap-2 sm:ml-6">
              <div className="hidden lg:block">
                <VendorNotificationBell />
              </div>
              {dashboard ? (
                <span className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-teal-50 px-3 text-sm font-semibold text-teal-800">
                  <LuTrendingUp className="h-4 w-4" />
                  {dashboard.stats.revenueChangeLabel} revenue
                </span>
              ) : null}
            </div>
          </div>
        </FadeInOnScroll>

        {loading ? (
          <p className="text-sm text-slate-500">Loading dashboard...</p>
        ) : null}

        {error ? (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
        ) : null}

        {!loading && dashboard ? (
          <>
            <FadeInOnScroll delay={80}>
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {statCards.map((stat) => (
                  <article
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                    key={stat.label}
                  >
                    <div className="flex items-start justify-between">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.accent}`}>
                        <stat.icon className="h-5 w-5" strokeWidth={2} />
                      </div>
                      <span
                        className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
                          stat.up ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {stat.up ? (
                          <LuArrowUpRight className="h-3.5 w-3.5" />
                        ) : (
                          <LuArrowDownRight className="h-3.5 w-3.5" />
                        )}
                        {stat.change}
                      </span>
                    </div>
                    <p className="mt-4 text-sm font-medium text-slate-600">{stat.label}</p>
                    <p className="mt-1 text-2xl font-bold text-slate-900">{stat.value}</p>
                    <p className="mt-1 text-xs text-slate-500">{stat.sub}</p>
                  </article>
                ))}
              </section>
            </FadeInOnScroll>

            <FadeInOnScroll delay={120}>
              <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Revenue Overview</h2>
                      <p className="text-sm text-slate-500">Monthly revenue trend (NPR thousands)</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      {currentYear}
                    </span>
                  </div>
                  <div className="h-56 w-full">
                    <RevenueChart months={dashboard.charts.revenueByMonth} />
                  </div>
                </article>

                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-900">Order Status</h2>
                  <p className="mb-4 text-sm text-slate-500">Distribution of all orders</p>
                  <OrderStatusDonut slices={dashboard.charts.orderStatusBreakdown} />
                </article>
              </section>
            </FadeInOnScroll>

            <FadeInOnScroll delay={160}>
              <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
                <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Recent Orders</h2>
                      <p className="text-sm text-slate-500">Latest customer purchases from your store</p>
                    </div>
                    <Link className="text-sm font-semibold text-teal-700 hover:text-teal-800" to="/vendororder">
                      View all
                    </Link>
                  </div>
                  <div className="overflow-x-auto">
                    {dashboard.recentOrders.length === 0 ? (
                      <p className="px-5 py-8 text-sm text-slate-500">No orders yet.</p>
                    ) : (
                      <table className="min-w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                          <tr>
                            <th className="px-5 py-3">Order</th>
                            <th className="px-5 py-3">Customer</th>
                            <th className="px-5 py-3">Product</th>
                            <th className="px-5 py-3">Amount</th>
                            <th className="px-5 py-3">Status</th>
                            <th className="px-5 py-3">Date</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {dashboard.recentOrders.map((order) => {
                            const statusLabel = formatOrderStatus(order.status)
                            return (
                              <tr className="hover:bg-slate-50/80" key={order.id}>
                                <td className="px-5 py-3.5 font-semibold text-teal-700">#{order.id}</td>
                                <td className="px-5 py-3.5 text-slate-800">{order.clientName}</td>
                                <td className="px-5 py-3.5 text-slate-600">{order.productName}</td>
                                <td className="px-5 py-3.5 font-medium text-slate-900">
                                  {formatNpr(orderLineTotal(order))}
                                </td>
                                <td className="px-5 py-3.5">
                                  <span
                                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusTone[statusLabel] ?? 'bg-slate-100 text-slate-700'}`}
                                  >
                                    {statusLabel}
                                  </span>
                                </td>
                                <td className="px-5 py-3.5 text-slate-500">{formatOrderDate(order.orderDate)}</td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </article>

                <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900">Top Products</h2>
                      <p className="text-sm text-slate-500">Best performers by units sold</p>
                    </div>
                    <Link className="text-sm font-semibold text-teal-700 hover:text-teal-800" to="/vendorproduct">
                      Manage
                    </Link>
                  </div>
                  {dashboard.topProducts.length === 0 ? (
                    <p className="text-sm text-slate-500">No product sales yet.</p>
                  ) : (
                    <ul className="space-y-3">
                      {dashboard.topProducts.map((product) => (
                        <li
                          className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-3"
                          key={product.productId}
                        >
                          <TopProductImage imageUrl={product.imageUrl} name={product.name} />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-900">{product.name}</p>
                            <p className="text-xs text-slate-500">{product.sold} units sold</p>
                          </div>
                          <p className="shrink-0 text-sm font-semibold text-slate-800">
                            {formatNpr(product.revenue)}
                          </p>
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              </section>
            </FadeInOnScroll>
          </>
        ) : null}
      </VendorMain>
    </VendorLayout>
  )
}

export default VendorDashboard
