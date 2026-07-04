import {
  LuArrowUpRight,
  LuCircleDollarSign,
  LuShoppingBag,
  LuStore,
  LuTrendingUp,
  LuUsers,
} from 'react-icons/lu'
import { useEffect, useMemo, useState, type ComponentType } from 'react'
import { Link } from 'react-router-dom'
import AdminNavbar from '../AdminComponents/AdminNavbar'
import AdminNotificationBell from '../AdminComponents/AdminNotificationBell'
import { AdminLayout, AdminMain, FadeInOnScroll } from '../components/PortalMain'
import { getStoredUser } from '../lib/auth'
import { resolveProfileImageUrl } from '../lib/api'
import {
  fetchAdminDashboard,
  formatNpr,
  formatPlatformRevenue,
  type AdminChartMonthPoint,
  type AdminDashboardData,
  type AdminVendorStatusSlice,
} from '../lib/adminDashboardApi'

type StatCard = {
  label: string
  value: string
  change: string
  sub: string
  icon: ComponentType<{ className?: string; strokeWidth?: number }>
  accent: string
}

function TopVendorLogo({ businessName, profileImage }: { businessName: string; profileImage: string | null }) {
  const [imageFailed, setImageFailed] = useState(false)
  const logoUrl = profileImage ? resolveProfileImageUrl(profileImage) : null
  const initial = (businessName.trim().charAt(0) || '?').toUpperCase()

  useEffect(() => {
    setImageFailed(false)
  }, [profileImage])

  if (logoUrl && !imageFailed) {
    return (
      <img
        alt=""
        className="h-10 w-10 shrink-0 rounded-lg border border-slate-200 object-cover"
        onError={() => setImageFailed(true)}
        referrerPolicy="no-referrer"
        src={logoUrl}
      />
    )
  }

  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-700 text-sm font-bold text-white">
      {initial}
    </span>
  )
}

function PlatformRevenueChart({ months }: { months: AdminChartMonthPoint[] }) {
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
        <linearGradient id="adminRevenueFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#0d9488" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#0d9488" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#adminRevenueFill)" />
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

function VendorStatusDonut({ slices }: { slices: AdminVendorStatusSlice[] }) {
  const total = slices.reduce((sum, slice) => sum + slice.count, 0)
  let offset = 0
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const denominator = total > 0 ? total : 1

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative h-40 w-40 shrink-0">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 140 140">
          <circle cx="70" cy="70" fill="none" r={radius} stroke="#f1f5f9" strokeWidth="16" />
          {slices.map((slice) => {
            const dash = total > 0 ? (slice.count / denominator) * circumference : 0
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
          <p className="text-xs text-slate-500">Vendors</p>
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

const AdminDashboard = () => {
  const adminName = getStoredUser()?.fullName?.trim() || 'Admin'
  const [dashboard, setDashboard] = useState<AdminDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const currentYear = new Date().getFullYear()

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchAdminDashboard()
        if (!cancelled) setDashboard(data)
      } catch {
        if (!cancelled) {
          setError('Could not load dashboard data.')
          setDashboard(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const statCards = useMemo<StatCard[]>(() => {
    if (!dashboard) return []

    const { stats } = dashboard
    return [
      {
        label: 'Total Users',
        value: stats.totalUsers.toLocaleString(),
        change: '—',
        sub: `${stats.totalUsers.toLocaleString()} registered customers`,
        icon: LuUsers,
        accent: 'bg-sky-50 text-sky-700',
      },
      {
        label: 'Active Vendors',
        value: stats.activeVendors.toLocaleString(),
        change: stats.pendingVendors > 0 ? `+${stats.pendingVendors}` : '0',
        sub: `${stats.pendingVendors} pending approval`,
        icon: LuStore,
        accent: 'bg-violet-50 text-violet-700',
      },
      {
        label: 'Platform Orders',
        value: stats.totalOrders.toLocaleString(),
        change: stats.ordersChangeLabel,
        sub: `${stats.ordersThisWeek.toLocaleString()} this week`,
        icon: LuShoppingBag,
        accent: 'bg-emerald-50 text-emerald-700',
      },
      {
        label: 'Platform Revenue',
        value: formatPlatformRevenue(stats.platformRevenue),
        change: stats.revenueChangeLabel,
        sub: 'All vendors combined',
        icon: LuCircleDollarSign,
        accent: 'bg-amber-50 text-amber-700',
      },
    ]
  }, [dashboard])

  const revenueGrowthLabel = dashboard?.stats.revenueChangeLabel ?? '—'

  return (
    <AdminLayout>
      <AdminNavbar />
      <AdminMain className="flex-1 overflow-y-auto p-6 lg:p-8">
        <FadeInOnScroll>
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-teal-700">Admin Portal</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
            <p className="mt-1 text-sm text-slate-600">
              Welcome back, <span className="font-medium text-slate-800">{adminName}</span>. Monitor platform health,
              vendors, and user activity.
            </p>
          </div>
          <div className="flex shrink-0 items-center justify-end gap-2 sm:ml-6">
            <div className="hidden lg:block">
              <AdminNotificationBell />
            </div>
            <span className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm">
              Last 30 days
            </span>
            <span className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-teal-50 px-3 text-sm font-semibold text-teal-800">
              <LuTrendingUp className="h-4 w-4" />
              {revenueGrowthLabel} revenue
            </span>
          </div>
        </div>
        </FadeInOnScroll>

        {error ? (
          <p className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
        ) : null}

        <FadeInOnScroll delay={80}>
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, index) => (
                <article
                  className="animate-pulse rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  key={`stat-skeleton-${index}`}
                >
                  <div className="h-11 w-11 rounded-xl bg-slate-100" />
                  <div className="mt-4 h-4 w-24 rounded bg-slate-100" />
                  <div className="mt-3 h-8 w-28 rounded bg-slate-100" />
                  <div className="mt-3 h-3 w-32 rounded bg-slate-100" />
                </article>
              ))
            : statCards.map((stat) => (
                <article
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md"
                  key={stat.label}
                >
                  <div className="flex items-start justify-between">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${stat.accent}`}>
                      <stat.icon className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                      <LuArrowUpRight className="h-3.5 w-3.5" />
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
                <h2 className="text-lg font-bold text-slate-900">Platform Revenue</h2>
                <p className="text-sm text-slate-500">Combined revenue across all vendors (NPR lakhs)</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                {currentYear}
              </span>
            </div>
            <div className="h-56 w-full">
              {loading ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">Loading chart…</div>
              ) : error || !dashboard ? (
                <div className="flex h-full items-center justify-center text-sm text-slate-500">Chart unavailable.</div>
              ) : (
                <PlatformRevenueChart months={dashboard.charts.revenueByMonth} />
              )}
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Vendor Status</h2>
            <p className="mb-4 text-sm text-slate-500">Application and account breakdown</p>
            {loading ? (
              <div className="flex h-40 items-center justify-center text-sm text-slate-500">Loading…</div>
            ) : error || !dashboard ? (
              <div className="flex h-40 items-center justify-center text-sm text-slate-500">Data unavailable.</div>
            ) : (
              <VendorStatusDonut slices={dashboard.charts.vendorStatusBreakdown} />
            )}
          </article>
        </section>
        </FadeInOnScroll>

        <FadeInOnScroll delay={160}>
        <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
          <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Pending Vendor Applications</h2>
                <p className="text-sm text-slate-500">Pharmacies awaiting admin review</p>
              </div>
              <Link className="text-sm font-semibold text-teal-700 hover:text-teal-800 hover:underline" to="/adminapprovevendor">
                View all
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3">Pharmacy</th>
                    <th className="px-5 py-3">Owner</th>
                    <th className="px-5 py-3">City</th>
                    <th className="px-5 py-3">Applied</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td className="px-5 py-8 text-center text-slate-500" colSpan={4}>
                        Loading applications…
                      </td>
                    </tr>
                  ) : dashboard?.pendingVendors.length === 0 ? (
                    <tr>
                      <td className="px-5 py-8 text-center text-slate-500" colSpan={4}>
                        No pending vendor applications.
                      </td>
                    </tr>
                  ) : (
                    dashboard?.pendingVendors.map((vendor) => (
                      <tr className="hover:bg-slate-50/80" key={vendor.id}>
                        <td className="px-5 py-3.5 font-semibold text-slate-900">{vendor.businessName}</td>
                        <td className="px-5 py-3.5 text-slate-700">{vendor.ownerName}</td>
                        <td className="px-5 py-3.5 text-slate-600">{vendor.city}</td>
                        <td className="px-5 py-3.5 text-slate-500">{vendor.appliedAt}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Top Vendors</h2>
            <p className="mb-4 text-sm text-slate-500">Highest performing pharmacies</p>
            {loading ? (
              <p className="py-8 text-center text-sm text-slate-500">Loading vendors…</p>
            ) : !dashboard || dashboard.topVendors.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-500">No vendor order data yet.</p>
            ) : (
              <ul className="space-y-3">
                {dashboard.topVendors.map((vendor) => (
                  <li className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-3" key={vendor.vendorId}>
                    <div className="flex items-center gap-3">
                      <TopVendorLogo businessName={vendor.businessName} profileImage={vendor.profileImage} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-slate-900">{vendor.businessName}</p>
                        <p className="text-xs text-slate-500">
                          {vendor.orderCount} orders
                          {vendor.averageRating != null ? ` · ★ ${vendor.averageRating.toFixed(1)}` : ''}
                        </p>
                      </div>
                    </div>
                    <p className="mt-2 pl-[52px] text-sm font-semibold text-slate-800">{formatNpr(vendor.revenue)}</p>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </section>
        </FadeInOnScroll>
      </AdminMain>
    </AdminLayout>
  )
}

export default AdminDashboard
