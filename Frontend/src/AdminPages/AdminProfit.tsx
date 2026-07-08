import AdminNavbar from '../AdminComponents/AdminNavbar'
import { AdminLayout, AdminMain, FadeInOnScroll } from '../components/PortalMain'
import { useEffect, useMemo, useState, type ComponentType } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import {
  buildAdminProfitPeriodOptions,
  fetchAdminProfit,
  formatNpr,
  type AdminProductProfitItem,
} from '../lib/adminProfitApi'
import AdminProfitPeriodPicker from '../AdminComponents/AdminProfitPeriodPicker'
import {
  LuCircleDollarSign,
  LuPackage,
  LuPercent,
  LuSearch,
  LuShoppingBag,
  LuStore,
} from 'react-icons/lu'

const periodOptions = buildAdminProfitPeriodOptions(12)

const formatSoldDate = (iso: string): string => {
  if (!iso) return '—'
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString()
}

type KpiCard = {
  label: string
  value: string
  sub: string
  icon: ComponentType<{ className?: string; strokeWidth?: number }>
  accent: string
}

const AdminProfit = () => {
  const [products, setProducts] = useState<AdminProductProfitItem[]>([])
  const [totalAdminProfit, setTotalAdminProfit] = useState(0)
  const [periodLabel, setPeriodLabel] = useState('')
  const [selectedPeriodValue, setSelectedPeriodValue] = useState(periodOptions[0]?.value ?? 'all')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const selectedPeriod = useMemo(
    () => periodOptions.find((option) => option.value === selectedPeriodValue) ?? periodOptions[0],
    [selectedPeriodValue],
  )

  useEffect(() => {
    if (!selectedPeriod) return

    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await fetchAdminProfit(selectedPeriod.query)
        if (!cancelled) {
          setProducts(data.products)
          setTotalAdminProfit(data.totalAdminProfit)
          setPeriodLabel(data.periodLabel)
        }
      } catch (err) {
        if (!cancelled) {
          setError('Could not load profit data. Is the backend running?')
          toast.error('Failed to load profit data.')
          console.error(err)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [selectedPeriod])

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return products
    return products.filter((product) => {
      const haystack = [product.productName, product.productSku, product.vendorBusinessName]
      return haystack.some((value) => value.toLowerCase().includes(query))
    })
  }, [products, searchQuery])

  const kpiCards = useMemo<KpiCard[]>(() => {
    const totalSales = products.reduce((sum, product) => sum + product.totalSales, 0)
    const unitsSold = products.reduce((sum, product) => sum + product.quantitySold, 0)
    const vendorCount = new Set(products.map((product) => product.vendorId)).size
    const periodText = periodLabel || 'Selected period'

    return [
      {
        label: 'Admin Profit',
        value: formatNpr(totalAdminProfit),
        sub: `20% commission · ${periodText}`,
        icon: LuCircleDollarSign,
        accent: 'bg-teal-50 text-teal-700',
      },
      {
        label: 'Total Sales',
        value: formatNpr(totalSales),
        sub: `Gross sales · ${periodText}`,
        icon: LuShoppingBag,
        accent: 'bg-emerald-50 text-emerald-700',
      },
      {
        label: 'Products Sold',
        value: products.length.toLocaleString(),
        sub: `${unitsSold.toLocaleString()} units sold`,
        icon: LuPackage,
        accent: 'bg-sky-50 text-sky-700',
      },
      {
        label: 'Active Vendors',
        value: vendorCount.toLocaleString(),
        sub: 'Vendors with sales in period',
        icon: LuStore,
        accent: 'bg-violet-50 text-violet-700',
      },
    ]
  }, [products, totalAdminProfit, periodLabel])

  return (
    <AdminLayout>
      <AdminNavbar />
      <AdminMain>
        <FadeInOnScroll>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-teal-700">Key Performance Indicators</p>
              <h1 className="mt-1 text-2xl font-bold text-slate-900">Admin Profit</h1>
              <p className="mt-1 text-sm text-slate-600">
                Products sold in the selected period. Admin earns{' '}
                <span className="font-semibold text-teal-700">20%</span> commission on each sale. Recently sold
                products appear first. Choose <span className="font-semibold">All history</span> to see every sold
                product.
                {!loading && !error ? (
                  <span className="ml-2 text-slate-500">({products.length} products in this period)</span>
                ) : null}
              </p>
            </div>

            <section className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {loading
                ? Array.from({ length: 4 }).map((_, index) => (
                    <article
                      className="animate-pulse rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm"
                      key={`kpi-skeleton-${index}`}
                    >
                      <div className="h-8 w-8 rounded-lg bg-slate-100" />
                      <div className="mt-2.5 h-3 w-20 rounded bg-slate-100" />
                      <div className="mt-2 h-6 w-24 rounded bg-slate-100" />
                      <div className="mt-2 h-2.5 w-28 rounded bg-slate-100" />
                    </article>
                  ))
                : kpiCards.map((card) => (
                    <article
                      className="rounded-xl border border-slate-200 bg-white p-3.5 shadow-sm transition hover:shadow-md"
                      key={card.label}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${card.accent}`}>
                          <card.icon className="h-4 w-4" strokeWidth={2} />
                        </div>
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-teal-50 px-1.5 py-px text-[10px] font-semibold text-teal-700">
                          <LuPercent className="h-3 w-3" />
                          KPI
                        </span>
                      </div>
                      <p className="mt-2.5 text-xs font-medium text-slate-600">{card.label}</p>
                      <p className="mt-0.5 text-lg font-bold leading-tight text-slate-900">{card.value}</p>
                      <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-slate-500">{card.sub}</p>
                    </article>
                  ))}
            </section>

            <div className="flex w-full flex-wrap items-center justify-between gap-y-3">
              <AdminProfitPeriodPicker
                className="w-full shrink-0 sm:w-[260px]"
                onChange={setSelectedPeriodValue}
                value={selectedPeriodValue}
              />
              <label className="relative block w-full shrink-0 sm:w-80 sm:max-w-md">
                <LuSearch
                  aria-hidden
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                />
                <input
                  className="h-11 w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3 text-sm text-slate-700 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  placeholder="Search product, vendor, SKU..."
                  type="text"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </label>
            </div>
          </div>

          <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-5 py-3 text-sm font-semibold text-slate-700">No.</th>
                    <th className="px-5 py-3 text-sm font-semibold text-slate-700">Product</th>
                    <th className="px-5 py-3 text-sm font-semibold text-slate-700">Vendor</th>
                    <th className="px-5 py-3 text-sm font-semibold text-slate-700">Price (NPR)</th>
                    <th className="px-5 py-3 text-sm font-semibold text-slate-700">Sold</th>
                    <th className="px-5 py-3 text-sm font-semibold text-slate-700">Total sales</th>
                    <th className="px-5 py-3 text-sm font-semibold text-slate-700">Admin profit (20%)</th>
                    <th className="px-5 py-3 text-sm font-semibold text-slate-700">First sold</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr className="border-t border-slate-200">
                      <td className="px-5 py-6 text-sm text-slate-500" colSpan={8}>
                        Loading profit data...
                      </td>
                    </tr>
                  ) : null}

                  {!loading && error ? (
                    <tr className="border-t border-slate-200">
                      <td className="px-5 py-6 text-sm text-rose-600" colSpan={8}>
                        {error}
                      </td>
                    </tr>
                  ) : null}

                  {!loading && !error && filteredProducts.length === 0 ? (
                    <tr className="border-t border-slate-200">
                      <td className="px-5 py-6 text-sm text-slate-500" colSpan={8}>
                        {products.length === 0
                          ? `No product sales in ${periodLabel || 'this period'} yet.`
                          : 'No matching products found.'}
                      </td>
                    </tr>
                  ) : null}

                  {!loading && !error
                    ? filteredProducts.map((product, index) => (
                        <tr className="border-t border-slate-200" key={`${product.productId}-${product.vendorId}`}>
                          <td className="px-5 py-4 text-sm text-slate-700">{index + 1}</td>
                          <td className="px-5 py-4">
                            <div className="flex min-w-[180px] items-center gap-3">
                              {product.productImage ? (
                                <img
                                  alt={product.productName}
                                  className="h-11 w-11 shrink-0 rounded-md border border-slate-200 object-cover"
                                  src={product.productImage}
                                />
                              ) : (
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-100 text-xs text-slate-400">
                                  —
                                </div>
                              )}
                              <div>
                                <p className="text-sm font-semibold text-slate-900">{product.productName}</p>
                                <p className="text-xs text-slate-500">{product.productSku || '—'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm">
                            <Link
                              className="font-medium text-teal-700 hover:text-teal-800 hover:underline"
                              to={`/adminvendorprofile?vendorId=${product.vendorId}`}
                            >
                              {product.vendorBusinessName}
                            </Link>
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-800">
                            {Number(product.unitPrice).toLocaleString()}
                          </td>
                          <td className="px-5 py-4 text-sm text-slate-700">{product.quantitySold.toLocaleString()}</td>
                          <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-800">
                            {formatNpr(product.totalSales)}
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 text-sm font-bold text-teal-700">
                            {formatNpr(product.adminProfit)}
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                            {formatSoldDate(product.firstSoldAt)}
                          </td>
                        </tr>
                      ))
                    : null}
                </tbody>
              </table>
            </div>
          </section>
        </FadeInOnScroll>
      </AdminMain>
    </AdminLayout>
  )
}

export default AdminProfit
