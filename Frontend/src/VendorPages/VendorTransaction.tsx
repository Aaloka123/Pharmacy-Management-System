import { useEffect, useMemo, useState } from 'react'
import { LuCircleDollarSign, LuCreditCard, LuPackage, LuUsers } from 'react-icons/lu'
import Navbar from '../VendorComponents/Navbar'
import { VendorLayout, VendorMain, FadeInOnScroll } from '../components/PortalMain'
import fallbackImage from '../assets/Hero1.png'
import { resolveBackendUrl } from '../lib/api'
import {
  fetchVendorOrders,
  type VendorOrderDto,
} from '../lib/orderApi'

type TransactionRow = {
  id: number
  clientName: string
  email: string
  phone: string
  location: string
  productName: string
  productSku: string
  productImage: string
  unitPrice: number
  quantity: number
  amount: number
  paymentMethod: 'eSewa' | 'Khalti' | 'COD'
  orderDate: Date
}

const paymentLabel = (method: VendorOrderDto['paymentMethod']): TransactionRow['paymentMethod'] => {
  if (method === 'ESEWA') return 'eSewa'
  if (method === 'KHALTI') return 'Khalti'
  return 'COD'
}

const paymentTone: Record<TransactionRow['paymentMethod'], string> = {
  eSewa: 'bg-emerald-50 text-emerald-800',
  Khalti: 'bg-violet-50 text-violet-800',
  COD: 'bg-amber-50 text-amber-800',
}

const monthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

const monthLabel = (key: string) => {
  const [year, month] = key.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })
}

const formatNpr = (amount: number) => `NPR ${Math.round(amount).toLocaleString()}`

const dtoToTransaction = (dto: VendorOrderDto): TransactionRow => {
  const unitPrice = Number(dto.unitPrice)
  const quantity = dto.quantity
  return {
    id: dto.id,
    clientName: dto.clientName,
    email: dto.email,
    phone: dto.phone,
    location: dto.location,
    productName: dto.productName,
    productSku: dto.productSku,
    productImage: dto.productImage ? resolveBackendUrl(dto.productImage) : fallbackImage,
    unitPrice,
    quantity,
    amount: unitPrice * quantity,
    paymentMethod: paymentLabel(dto.paymentMethod),
    orderDate: new Date(dto.orderDate),
  }
}

const Transaction = () => {
  const [transactions, setTransactions] = useState<TransactionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [monthFilter, setMonthFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchVendorOrders()
        const delivered = data
          .filter((order) => order.status === 'DELIVERED')
          .map(dtoToTransaction)
          .sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime())
        setTransactions(delivered)
      } catch {
        setError('Could not load transactions. Please try again.')
        setTransactions([])
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const monthOptions = useMemo(() => {
    const keys = new Set<string>()
    const now = new Date()
    keys.add(monthKey(now))
    for (const row of transactions) {
      if (!Number.isNaN(row.orderDate.getTime())) {
        keys.add(monthKey(row.orderDate))
      }
    }
    return [...keys].sort((a, b) => b.localeCompare(a))
  }, [transactions])

  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase()
    return transactions.filter((row) => {
      if (monthFilter !== 'all' && monthKey(row.orderDate) !== monthFilter) {
        return false
      }
      if (!q) return true
      return (
        row.clientName.toLowerCase().includes(q) ||
        row.email.toLowerCase().includes(q) ||
        row.phone.toLowerCase().includes(q) ||
        row.productName.toLowerCase().includes(q) ||
        row.productSku.toLowerCase().includes(q) ||
        row.paymentMethod.toLowerCase().includes(q) ||
        String(row.id).includes(q)
      )
    })
  }, [transactions, monthFilter, searchTerm])

  const totalRevenue = useMemo(
    () => filtered.reduce((sum, row) => sum + row.amount, 0),
    [filtered],
  )

  const paymentCounts = useMemo(() => {
    const counts = { eSewa: 0, Khalti: 0, COD: 0 }
    for (const row of filtered) {
      counts[row.paymentMethod] += 1
    }
    return counts
  }, [filtered])

  const uniqueCustomers = useMemo(
    () => new Set(filtered.map((row) => row.email || row.clientName)).size,
    [filtered],
  )

  return (
    <VendorLayout>
      <Navbar />
      <VendorMain>
        <FadeInOnScroll>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
              <p className="mt-1 text-sm text-slate-600">
                Delivered orders only — payment method, product, and customer details.
              </p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
              <select
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 sm:min-w-[180px]"
                onChange={(event) => setMonthFilter(event.target.value)}
                value={monthFilter}
              >
                <option value="all">All months</option>
                {monthOptions.map((key) => (
                  <option key={key} value={key}>
                    {monthLabel(key)}
                  </option>
                ))}
              </select>
              <input
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 sm:max-w-xs"
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search customer, product…"
                type="search"
                value={searchTerm}
              />
            </div>
          </div>

          <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <LuCircleDollarSign className="h-5 w-5" strokeWidth={2} />
              </div>
              <p className="mt-4 text-sm font-medium text-slate-600">Revenue</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {loading ? '—' : formatNpr(totalRevenue)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {monthFilter === 'all' ? 'All delivered orders' : monthLabel(monthFilter)}
              </p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                <LuPackage className="h-5 w-5" strokeWidth={2} />
              </div>
              <p className="mt-4 text-sm font-medium text-slate-600">Delivered orders</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {loading ? '—' : filtered.length.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-slate-500">In selected period</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                <LuUsers className="h-5 w-5" strokeWidth={2} />
              </div>
              <p className="mt-4 text-sm font-medium text-slate-600">Customers</p>
              <p className="mt-1 text-2xl font-bold text-slate-900">
                {loading ? '—' : uniqueCustomers.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-slate-500">Unique buyers</p>
            </article>
            <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <LuCreditCard className="h-5 w-5" strokeWidth={2} />
              </div>
              <p className="mt-4 text-sm font-medium text-slate-600">Payments</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {loading
                  ? '—'
                  : `eSewa ${paymentCounts.eSewa} · Khalti ${paymentCounts.Khalti} · COD ${paymentCounts.COD}`}
              </p>
              <p className="mt-1 text-xs text-slate-500">By payment method</p>
            </article>
          </section>

          <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {loading ? (
              <p className="px-5 py-8 text-center text-sm text-slate-500">Loading transactions…</p>
            ) : error ? (
              <p className="px-5 py-8 text-center text-sm text-rose-600">{error}</p>
            ) : filtered.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-slate-500">
                {transactions.length === 0
                  ? 'No delivered orders yet. Transactions appear after you mark orders as Delivered.'
                  : 'No transactions match this month or search.'}
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="px-5 py-3">Order</th>
                      <th className="px-5 py-3">Customer</th>
                      <th className="px-5 py-3">Product</th>
                      <th className="px-5 py-3">Payment</th>
                      <th className="px-5 py-3">Qty</th>
                      <th className="px-5 py-3">Amount</th>
                      <th className="px-5 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filtered.map((row) => (
                      <tr className="align-top hover:bg-slate-50/80" key={row.id}>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900">#{row.id}</p>
                          <p className="mt-0.5 text-xs text-emerald-700">Delivered</p>
                        </td>
                        <td className="px-5 py-4">
                          <p className="font-semibold text-slate-900">{row.clientName}</p>
                          <p className="mt-0.5 text-xs text-slate-500">{row.email}</p>
                          <p className="text-xs text-slate-500">{row.phone}</p>
                          <p className="mt-1 max-w-[200px] text-xs text-slate-400">{row.location}</p>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-start gap-3">
                            <img
                              alt=""
                              className="h-11 w-11 shrink-0 rounded-lg border border-slate-200 object-cover"
                              src={row.productImage}
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900">{row.productName}</p>
                              <p className="mt-0.5 text-xs text-slate-500">SKU: {row.productSku || '—'}</p>
                              <p className="text-xs text-slate-500">{formatNpr(row.unitPrice)} each</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${paymentTone[row.paymentMethod]}`}
                          >
                            {row.paymentMethod}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-medium text-slate-800">{row.quantity}</td>
                        <td className="px-5 py-4 font-semibold text-slate-900">{formatNpr(row.amount)}</td>
                        <td className="px-5 py-4 text-slate-600">
                          {Number.isNaN(row.orderDate.getTime())
                            ? '—'
                            : row.orderDate.toLocaleDateString(undefined, {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </FadeInOnScroll>
      </VendorMain>
    </VendorLayout>
  )
}

export default Transaction
