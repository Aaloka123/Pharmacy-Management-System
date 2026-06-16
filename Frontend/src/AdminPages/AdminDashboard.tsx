import {
  LuArrowUpRight,
  LuBadgeCheck,
  LuBell,
  LuCircleDollarSign,
  LuPackage,
  LuShoppingBag,
  LuStore,
  LuTrendingUp,
  LuUsers,
} from 'react-icons/lu'
import { Link } from 'react-router-dom'
import AdminNavbar from '../AdminComponents/AdminNavbar'
import { AdminLayout, AdminMain, FadeInOnScroll } from '../components/PortalMain'
import { getStoredUser } from '../lib/auth'

const STATS = [
  {
    label: 'Total Users',
    value: '12,480',
    change: '+14.2%',
    up: true,
    sub: '842 new this month',
    icon: LuUsers,
    accent: 'bg-sky-50 text-sky-700',
  },
  {
    label: 'Active Vendors',
    value: '186',
    change: '+6',
    up: true,
    sub: '12 pending approval',
    icon: LuStore,
    accent: 'bg-violet-50 text-violet-700',
  },
  {
    label: 'Platform Orders',
    value: '28,640',
    change: '+9.8%',
    up: true,
    sub: '1,920 this week',
    icon: LuShoppingBag,
    accent: 'bg-emerald-50 text-emerald-700',
  },
  {
    label: 'Platform Revenue',
    value: 'NRP 1.24 Cr',
    change: '+11.5%',
    up: true,
    sub: 'All vendors combined',
    icon: LuCircleDollarSign,
    accent: 'bg-amber-50 text-amber-700',
  },
] as const

const REVENUE_MONTHS = [
  { label: 'Jan', value: 72 },
  { label: 'Feb', value: 78 },
  { label: 'Mar', value: 85 },
  { label: 'Apr', value: 92 },
  { label: 'May', value: 98 },
  { label: 'Jun', value: 104 },
  { label: 'Jul', value: 110 },
  { label: 'Aug', value: 118 },
  { label: 'Sep', value: 112 },
  { label: 'Oct', value: 126 },
  { label: 'Nov', value: 134 },
  { label: 'Dec', value: 142 },
]

const USER_GROWTH = [
  { month: 'Jan', users: 820 },
  { month: 'Feb', users: 940 },
  { month: 'Mar', users: 1010 },
  { month: 'Apr', users: 1120 },
  { month: 'May', users: 1180 },
  { month: 'Jun', users: 1240 },
]

const VENDOR_STATUS = [
  { label: 'Approved', value: 72, color: '#059669' },
  { label: 'Pending', value: 14, color: '#d97706' },
  { label: 'Rejected', value: 8, color: '#e11d48' },
  { label: 'Suspended', value: 6, color: '#64748b' },
]

const PENDING_VENDORS = [
  { name: 'Himalaya Pharmacy', owner: 'Ramesh K.C.', city: 'Kathmandu', applied: '16 Jun 2026' },
  { name: 'Green Care Meds', owner: 'Sunita Rai', city: 'Pokhara', applied: '15 Jun 2026' },
  { name: 'City Health Store', owner: 'Prakash Shrestha', city: 'Lalitpur', applied: '15 Jun 2026' },
  { name: 'Nepal Wellness Hub', owner: 'Anjali Thapa', city: 'Bhaktapur', applied: '14 Jun 2026' },
]

const RECENT_ACTIVITY = [
  { action: 'Vendor approved', detail: 'Annapurna Pharmacy · Kathmandu', time: '12 min ago', tone: 'text-emerald-700 bg-emerald-50' },
  { action: 'New user signup', detail: 'Bikash Adhikari joined MedNexus', time: '28 min ago', tone: 'text-sky-700 bg-sky-50' },
  { action: 'Product flagged', detail: 'Ibuprofen 400mg · review required', time: '1 hr ago', tone: 'text-amber-700 bg-amber-50' },
  { action: 'Order completed', detail: 'Order #MN-8821 · NRP 2,450', time: '2 hr ago', tone: 'text-violet-700 bg-violet-50' },
  { action: 'Vendor application', detail: 'Himalaya Pharmacy submitted documents', time: '3 hr ago', tone: 'text-teal-700 bg-teal-50' },
]

const TOP_VENDORS = [
  { name: 'Annapurna Pharmacy', orders: 1240, revenue: 'NRP 18,40,000', rating: 4.9 },
  { name: 'MediCare Plus', orders: 986, revenue: 'NRP 14,20,500', rating: 4.8 },
  { name: 'LifeLine Chemist', orders: 874, revenue: 'NRP 12,95,200', rating: 4.7 },
  { name: 'Swasthya Kendra', orders: 712, revenue: 'NRP 10,60,800', rating: 4.6 },
]

function PlatformRevenueChart() {
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

function UserGrowthChart() {
  const max = Math.max(...USER_GROWTH.map((m) => m.users))

  return (
    <div className="flex h-52 items-end justify-between gap-4 px-2 pt-4">
      {USER_GROWTH.map((item) => (
        <div className="flex flex-1 flex-col items-center gap-2" key={item.month}>
          <span className="text-xs font-medium text-slate-600">{item.users}</span>
          <div
            className="w-full max-w-12 rounded-t-md bg-linear-to-t from-indigo-700 to-indigo-500"
            style={{ height: `${(item.users / max) * 100}%`, minHeight: '14%' }}
          />
          <span className="text-xs text-slate-500">{item.month}</span>
        </div>
      ))}
    </div>
  )
}

function VendorStatusDonut() {
  const total = VENDOR_STATUS.reduce((sum, s) => sum + s.value, 0)
  let offset = 0
  const radius = 54
  const circumference = 2 * Math.PI * radius

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative h-40 w-40 shrink-0">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 140 140">
          <circle cx="70" cy="70" fill="none" r={radius} stroke="#f1f5f9" strokeWidth="16" />
          {VENDOR_STATUS.map((slice) => {
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
          <p className="text-2xl font-bold text-slate-900">186</p>
          <p className="text-xs text-slate-500">Vendors</p>
        </div>
      </div>
      <ul className="w-full space-y-2.5 sm:max-w-[180px]">
        {VENDOR_STATUS.map((slice) => (
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

const AdminDashboard = () => {
  const adminName = getStoredUser()?.fullName?.trim() || 'Admin'

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
              +11.2% growth
            </span>
          </div>
        </div>
        </FadeInOnScroll>

        <FadeInOnScroll delay={80}>
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

        <FadeInOnScroll delay={100}>
        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Link
            className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 shadow-sm transition hover:border-amber-300 hover:shadow-md"
            to="/adminapprovevendor"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <LuBadgeCheck className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">12 pending approvals</p>
              <p className="text-xs text-slate-600">Review vendor applications</p>
            </div>
          </Link>
          <Link
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-teal-200 hover:shadow-md"
            to="/adminproducts"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
              <LuPackage className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">3,420 products</p>
              <p className="text-xs text-slate-600">Manage catalog listings</p>
            </div>
          </Link>
          <Link
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-teal-200 hover:shadow-md"
            to="/adminusers"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
              <LuUsers className="h-5 w-5" strokeWidth={2} />
            </span>
            <div>
              <p className="text-sm font-semibold text-slate-900">User management</p>
              <p className="text-xs text-slate-600">View and support customers</p>
            </div>
          </Link>
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
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">2026</span>
            </div>
            <div className="h-56 w-full">
              <PlatformRevenueChart />
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Vendor Status</h2>
            <p className="mb-4 text-sm text-slate-500">Application and account breakdown</p>
            <VendorStatusDonut />
          </article>
        </section>
        </FadeInOnScroll>

        <FadeInOnScroll delay={140}>
        <section className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">User Growth</h2>
            <p className="mb-2 text-sm text-slate-500">New registrations per month</p>
            <UserGrowthChart />
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Recent Activity</h2>
            <p className="mb-4 text-sm text-slate-500">Latest platform events</p>
            <ul className="space-y-3">
              {RECENT_ACTIVITY.map((item) => (
                <li className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-3" key={item.detail}>
                  <span className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${item.tone}`}>
                    {item.action}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800">{item.detail}</p>
                    <p className="text-xs text-slate-500">{item.time}</p>
                  </div>
                </li>
              ))}
            </ul>
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
                  {PENDING_VENDORS.map((vendor) => (
                    <tr className="hover:bg-slate-50/80" key={vendor.name}>
                      <td className="px-5 py-3.5 font-semibold text-slate-900">{vendor.name}</td>
                      <td className="px-5 py-3.5 text-slate-700">{vendor.owner}</td>
                      <td className="px-5 py-3.5 text-slate-600">{vendor.city}</td>
                      <td className="px-5 py-3.5 text-slate-500">{vendor.applied}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Top Vendors</h2>
            <p className="mb-4 text-sm text-slate-500">Highest performing pharmacies</p>
            <ul className="space-y-3">
              {TOP_VENDORS.map((vendor, index) => (
                <li
                  className="rounded-xl border border-slate-100 bg-slate-50/60 px-3 py-3"
                  key={vendor.name}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-teal-700 text-sm font-bold text-white">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{vendor.name}</p>
                      <p className="text-xs text-slate-500">
                        {vendor.orders} orders · ★ {vendor.rating}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 pl-11 text-sm font-semibold text-slate-800">{vendor.revenue}</p>
                </li>
              ))}
            </ul>
          </article>
        </section>
        </FadeInOnScroll>
      </AdminMain>
    </AdminLayout>
  )
}

export default AdminDashboard
