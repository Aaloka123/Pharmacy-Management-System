import {
  LuArrowDownRight,
  LuArrowUpRight,
  LuBell,
  LuCircleDollarSign,
  LuPackage,
  LuShoppingBag,
  LuStar,
  LuTrendingUp,
} from 'react-icons/lu'
import Navbar from '../VendorComponents/Navbar'
import { getStoredUser } from '../lib/auth'

const STATS = [
  {
    label: 'Total Revenue',
    value: 'NRP 4,82,350',
    change: '+12.4%',
    up: true,
    sub: 'vs last month',
    icon: LuCircleDollarSign,
    accent: 'bg-emerald-50 text-emerald-700',
  },
  {
    label: 'Total Orders',
    value: '1,284',
    change: '+8.2%',
    up: true,
    sub: '142 this week',
    icon: LuShoppingBag,
    accent: 'bg-sky-50 text-sky-700',
  },
  {
    label: 'Active Products',
    value: '86',
    change: '+3',
    up: true,
    sub: '4 low stock',
    icon: LuPackage,
    accent: 'bg-violet-50 text-violet-700',
  },
  {
    label: 'Average Rating',
    value: '4.8',
    change: '+0.2',
    up: true,
    sub: '328 reviews',
    icon: LuStar,
    accent: 'bg-amber-50 text-amber-700',
  },
] as const

const REVENUE_MONTHS = [
  { label: 'Jan', value: 62 },
  { label: 'Feb', value: 74 },
  { label: 'Mar', value: 68 },
  { label: 'Apr', value: 82 },
  { label: 'May', value: 91 },
  { label: 'Jun', value: 88 },
  { label: 'Jul', value: 96 },
  { label: 'Aug', value: 102 },
  { label: 'Sep', value: 98 },
  { label: 'Oct', value: 110 },
  { label: 'Nov', value: 118 },
  { label: 'Dec', value: 124 },
]

const WEEKLY_ORDERS = [
  { day: 'Mon', orders: 18 },
  { day: 'Tue', orders: 24 },
  { day: 'Wed', orders: 21 },
  { day: 'Thu', orders: 28 },
  { day: 'Fri', orders: 32 },
  { day: 'Sat', orders: 26 },
  { day: 'Sun', orders: 19 },
]

const ORDER_STATUS = [
  { label: 'Delivered', value: 58, color: '#059669' },
  { label: 'Shipped', value: 18, color: '#0284c7' },
  { label: 'Confirmed', value: 12, color: '#6366f1' },
  { label: 'Pending', value: 9, color: '#d97706' },
  { label: 'Canceled', value: 3, color: '#e11d48' },
]

const PAYMENT_SPLIT = [
  { label: 'eSewa', pct: 42, color: 'bg-emerald-500' },
  { label: 'Khalti', pct: 31, color: 'bg-purple-500' },
  { label: 'COD', pct: 27, color: 'bg-slate-500' },
]

const RECENT_ORDERS = [
  { id: '#VN-1042', customer: 'Sita Sharma', product: 'Paracetamol 500mg', amount: 'NRP 450', status: 'Shipped', date: '16 Jun 2026' },
  { id: '#VN-1041', customer: 'Ram Thapa', product: 'Amoxicillin 250mg', amount: 'NRP 1,280', status: 'Confirmed', date: '16 Jun 2026' },
  { id: '#VN-1040', customer: 'Anita Gurung', product: 'Vitamin C Tablets', amount: 'NRP 620', status: 'Delivered', date: '15 Jun 2026' },
  { id: '#VN-1039', customer: 'Bikash Rai', product: 'Cetirizine 10mg', amount: 'NRP 340', status: 'Pending', date: '15 Jun 2026' },
  { id: '#VN-1038', customer: 'Mina Karki', product: 'Omeprazole 20mg', amount: 'NRP 890', status: 'Delivered', date: '14 Jun 2026' },
]

const TOP_PRODUCTS = [
  { name: 'Paracetamol 500mg', sold: 214, revenue: 'NRP 96,300' },
  { name: 'Amoxicillin 250mg', sold: 168, revenue: 'NRP 2,15,040' },
  { name: 'Vitamin C 500mg', sold: 142, revenue: 'NRP 88,040' },
  { name: 'Cetirizine 10mg', sold: 121, revenue: 'NRP 41,140' },
]

const statusTone: Record<string, string> = {
  Delivered: 'bg-emerald-100 text-emerald-800',
  Shipped: 'bg-sky-100 text-sky-800',
  Confirmed: 'bg-indigo-100 text-indigo-800',
  Pending: 'bg-amber-100 text-amber-800',
  Canceled: 'bg-rose-100 text-rose-800',
}

function RevenueChart() {
  const width = 640
  const height = 220
  const padX = 36
  const padY = 24
  const max = Math.max(...REVENUE_MONTHS.map((m) => m.value))
  const points = REVENUE_MONTHS.map((m, i) => {
    const x = padX + (i / (REVENUE_MONTHS.length - 1)) * (width - padX * 2)
    const y = height - padY - (m.value / max) * (height - padY * 2)
    return { x, y, ...m }
  })
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padY} L ${points[0].x} ${height - padY} Z`

  return (
    <svg aria-hidden className="h-full w-full" viewBox={`0 0 ${width} ${height}`}>
      {[0, 0.25, 0.5, 0.75, 1].map((tick) => {
        const y = height - padY - tick * (height - padY * 2)
        return (
          <line key={tick} stroke="#e2e8f0" strokeDasharray="4 4" x1={padX} x2={width - padX} y1={y} y2={y} />
        )
      })}
      <defs>
        <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#0d9488" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#0d9488" stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#revenueFill)" />
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

function WeeklyOrdersChart() {
  const max = Math.max(...WEEKLY_ORDERS.map((d) => d.orders))

  return (
    <div className="flex h-52 items-end justify-between gap-3 px-2 pt-4">
      {WEEKLY_ORDERS.map((day) => (
        <div className="flex flex-1 flex-col items-center gap-2" key={day.day}>
          <span className="text-xs font-medium text-slate-600">{day.orders}</span>
          <div
            className="w-full max-w-10 rounded-t-md bg-linear-to-t from-teal-700 to-teal-500 transition"
            style={{ height: `${(day.orders / max) * 100}%`, minHeight: '12%' }}
          />
          <span className="text-xs text-slate-500">{day.day}</span>
        </div>
      ))}
    </div>
  )
}

function OrderStatusDonut() {
  const total = ORDER_STATUS.reduce((sum, s) => sum + s.value, 0)
  let offset = 0
  const radius = 54
  const circumference = 2 * Math.PI * radius

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative h-40 w-40 shrink-0">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 140 140">
          <circle cx="70" cy="70" fill="none" r={radius} stroke="#f1f5f9" strokeWidth="16" />
          {ORDER_STATUS.map((slice) => {
            const dash = (slice.value / total) * circumference
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
          <p className="text-2xl font-bold text-slate-900">{total}%</p>
          <p className="text-xs text-slate-500">Orders</p>
        </div>
      </div>
      <ul className="w-full space-y-2.5 sm:max-w-[180px]">
        {ORDER_STATUS.map((slice) => (
          <li className="flex items-center justify-between gap-3 text-sm" key={slice.label}>
            <span className="flex items-center gap-2 text-slate-600">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: slice.color }} />
              {slice.label}
            </span>
            <span className="font-semibold text-slate-900">{slice.value}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

const VendorDashboard = () => {
  const vendorName = getStoredUser()?.fullName?.trim() || 'Vendor'

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Navbar />
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
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
            <button
              aria-label="Notifications"
              className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:text-teal-700"
              title="Notifications"
              type="button"
            >
              <LuBell className="h-5 w-5" strokeWidth={2} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>
            <span className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 shadow-sm">
              Last 30 days
            </span>
            <span className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-teal-50 px-3 text-sm font-semibold text-teal-800">
              <LuTrendingUp className="h-4 w-4" />
              +10.8% growth
            </span>
          </div>
        </div>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {STATS.map((stat) => (
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
                  {stat.up ? <LuArrowUpRight className="h-3.5 w-3.5" /> : <LuArrowDownRight className="h-3.5 w-3.5" />}
                  {stat.change}
                </span>
              </div>
              <p className="mt-4 text-sm font-medium text-slate-600">{stat.label}</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">{stat.value}</p>
              <p className="mt-1 text-xs text-slate-500">{stat.sub}</p>
            </article>
          ))}
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm xl:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Revenue Overview</h2>
                <p className="text-sm text-slate-500">Monthly revenue trend (NPR thousands)</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                2026
              </span>
            </div>
            <div className="h-56 w-full">
              <RevenueChart />
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Order Status</h2>
            <p className="mb-4 text-sm text-slate-500">Distribution of all orders</p>
            <OrderStatusDonut />
          </article>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Weekly Orders</h2>
            <p className="mb-2 text-sm text-slate-500">Orders received per day</p>
            <WeeklyOrdersChart />
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Payment Methods</h2>
            <p className="mb-5 text-sm text-slate-500">Share of completed payments</p>
            <div className="space-y-4">
              {PAYMENT_SPLIT.map((item) => (
                <div key={item.label}>
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span className="font-medium text-slate-700">{item.label}</span>
                    <span className="font-semibold text-slate-900">{item.pct}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                    <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Top selling day</p>
              <p className="mt-1 text-lg font-bold text-slate-900">Friday · 32 orders</p>
            </div>
          </article>
        </section>

        <section className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
          <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm xl:col-span-2">
            <div className="border-b border-slate-100 px-5 py-4">
              <h2 className="text-lg font-bold text-slate-900">Recent Orders</h2>
              <p className="text-sm text-slate-500">Latest customer purchases from your store</p>
            </div>
            <div className="overflow-x-auto">
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
                  {RECENT_ORDERS.map((order) => (
                    <tr className="hover:bg-slate-50/80" key={order.id}>
                      <td className="px-5 py-3.5 font-semibold text-teal-700">{order.id}</td>
                      <td className="px-5 py-3.5 text-slate-800">{order.customer}</td>
                      <td className="px-5 py-3.5 text-slate-600">{order.product}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-900">{order.amount}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusTone[order.status] ?? 'bg-slate-100 text-slate-700'}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">{order.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Top Products</h2>
            <p className="mb-4 text-sm text-slate-500">Best performers this month</p>
            <ul className="space-y-3">
              {TOP_PRODUCTS.map((product, index) => (
                <li
                  className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-3"
                  key={product.name}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-700 text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{product.name}</p>
                    <p className="text-xs text-slate-500">{product.sold} units sold</p>
                  </div>
                  <p className="shrink-0 text-sm font-semibold text-slate-800">{product.revenue}</p>
                </li>
              ))}
            </ul>
          </article>
        </section>
      </main>
    </div>
  )
}

export default VendorDashboard
