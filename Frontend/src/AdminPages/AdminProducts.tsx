import AdminNavbar from '../AdminComponents/AdminNavbar'
import { AdminLayout, AdminMain, FadeInOnScroll } from '../components/PortalMain'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { getFirstProductImageUrl, listAdminProducts, type ProductDto } from '../lib/productsApi'
import { getProductExpiryStatus, isProductExpired } from '../lib/vendorNavBadges'

const formatExpiryDate = (dateStr: string): string => {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return Number.isNaN(date.getTime()) ? dateStr : date.toLocaleDateString()
}

const AdminProducts = () => {
  const [products, setProducts] = useState<ProductDto[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data } = await listAdminProducts()
        if (!cancelled) setProducts(data)
      } catch (err) {
        if (!cancelled) {
          setError('Could not load products. Is the backend running?')
          toast.error('Failed to load products.')
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
  }, [])

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    if (!query) return products
    return products.filter((product) => {
      const haystack = [
        product.productName,
        product.vendorBusinessName,
        product.vendorBusinessLocation ?? '',
        product.sku,
        product.category,
        product.productDescription,
      ]
      return haystack.some((value) => value.toLowerCase().includes(query))
    })
  }, [products, searchQuery])

  return (
    <AdminLayout>
      <AdminNavbar />
      <AdminMain>
        <FadeInOnScroll>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Admin Products</h1>
              <p className="mt-1 text-sm text-slate-600">
                All products listed by vendors across the platform.
                {!loading && !error ? (
                  <span className="ml-2 text-slate-500">({products.length} total)</span>
                ) : null}
              </p>
            </div>
            <input
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-teal-600 sm:w-72"
              placeholder="Search product, vendor, SKU..."
              type="text"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>

          <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-5 py-3 text-sm font-semibold text-slate-700">No.</th>
                    <th className="px-5 py-3 text-sm font-semibold text-slate-700">Product</th>
                    <th className="px-5 py-3 text-sm font-semibold text-slate-700">Vendor</th>
                    <th className="px-5 py-3 text-sm font-semibold text-slate-700">Pharmacy Location</th>
                    <th className="px-5 py-3 text-sm font-semibold text-slate-700">Price (NPR)</th>
                    <th className="min-w-[240px] px-5 py-3 text-sm font-semibold text-slate-700">Details</th>
                    <th className="px-5 py-3 text-sm font-semibold text-slate-700">Expiry</th>
                    <th className="px-5 py-3 text-sm font-semibold text-slate-700">Expired</th>
                    <th className="px-5 py-3 text-sm font-semibold text-slate-700">Deactivated</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr className="border-t border-slate-200">
                      <td className="px-5 py-6 text-sm text-slate-500" colSpan={9}>
                        Loading products...
                      </td>
                    </tr>
                  ) : null}

                  {!loading && error ? (
                    <tr className="border-t border-slate-200">
                      <td className="px-5 py-6 text-sm text-rose-600" colSpan={9}>
                        {error}
                      </td>
                    </tr>
                  ) : null}

                  {!loading && !error && filteredProducts.length === 0 ? (
                    <tr className="border-t border-slate-200">
                      <td className="px-5 py-6 text-sm text-slate-500" colSpan={9}>
                        {products.length === 0 ? 'No products found.' : 'No matching products found.'}
                      </td>
                    </tr>
                  ) : null}

                  {!loading && !error
                    ? filteredProducts.map((product, index) => {
                        const expiryStatus = getProductExpiryStatus(product.expiryDate)
                        const expired = isProductExpired(product.expiryDate)
                        const deactivated = product.status === 'INACTIVE'
                        const imageUrl = getFirstProductImageUrl(product.images)

                        return (
                          <tr
                            key={product.id}
                            className={`border-t border-slate-200 ${expired || deactivated ? 'bg-rose-50/50' : ''}`}
                          >
                            <td className="px-5 py-4 text-sm text-slate-700">{index + 1}</td>
                            <td className="px-5 py-4">
                              <div className="flex min-w-[180px] items-center gap-3">
                                {imageUrl ? (
                                  <img
                                    alt={product.productName}
                                    className="h-11 w-11 shrink-0 rounded-md border border-slate-200 object-cover"
                                    src={imageUrl}
                                  />
                                ) : (
                                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-slate-200 bg-slate-100 text-xs text-slate-400">
                                    —
                                  </div>
                                )}
                                <div>
                                  <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-900">
                                    <span>{product.productName}</span>
                                    {product.prescriptionRequired ? (
                                      <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[10px] font-semibold uppercase text-white">
                                        Rx
                                      </span>
                                    ) : null}
                                  </p>
                                  <p className="text-xs text-slate-500">{product.sku}</p>
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
                            <td className="max-w-[220px] px-5 py-4 text-sm text-slate-700">
                              {product.vendorBusinessLocation?.trim() || '—'}
                            </td>
                            <td className="whitespace-nowrap px-5 py-4 text-sm font-semibold text-slate-800">
                              {Number(product.price).toLocaleString()}
                            </td>
                            <td className="max-w-sm px-5 py-4 text-sm text-slate-600">
                              <p className="line-clamp-3" title={product.productDescription}>
                                {product.productDescription || '—'}
                              </p>
                            </td>
                            <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-700">
                              {formatExpiryDate(product.expiryDate)}
                            </td>
                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${expiryStatus.classes}`}
                              >
                                {expired ? 'Yes' : 'No'}
                              </span>
                            </td>
                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  deactivated
                                    ? 'bg-slate-100 text-slate-700'
                                    : 'bg-emerald-100 text-emerald-700'
                                }`}
                              >
                                {deactivated ? 'Yes' : 'No'}
                              </span>
                            </td>
                          </tr>
                        )
                      })
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

export default AdminProducts
