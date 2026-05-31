import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { FiMail, FiMapPin, FiPhone } from 'react-icons/fi'
import Copyright from '../UserComponents/Copyright'
import Footer from '../UserComponents/Footer'
import Header from '../UserComponents/Header'
import { resolveProfileImageUrl } from '../lib/api'
import { getFirstProductImageUrl, type ProductDto } from '../lib/productsApi'
import { getPublicVendor, listPublicVendorProducts, type PublicVendorDto } from '../lib/vendorsApi'

const shopInitial = (name: string) => {
  const trimmed = name.trim()
  return trimmed ? trimmed[0].toUpperCase() : '?'
}

const formatYear = (iso: string | null | undefined) => {
  if (!iso) return '—'
  const year = new Date(iso).getFullYear()
  return Number.isNaN(year) ? '—' : String(year)
}

function resolveVendorId(searchParams: URLSearchParams, state: unknown): number | null {
  const fromQuery = searchParams.get('id')
  if (fromQuery && !Number.isNaN(Number(fromQuery))) {
    return Number(fromQuery)
  }
  const fromState = (state as { vendorId?: number } | null)?.vendorId
  return fromState ?? null
}

const VendorProfile = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const vendorId = resolveVendorId(searchParams, location.state)

  const [vendor, setVendor] = useState<PublicVendorDto | null>(null)
  const [products, setProducts] = useState<ProductDto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [logoFailed, setLogoFailed] = useState(false)

  useEffect(() => {
    setVendor(null)
    setProducts([])
    setLogoFailed(false)

    if (vendorId == null) {
      setLoading(false)
      setError('No vendor selected.')
      return
    }

    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)

      try {
        const [vendorResult, productsResult] = await Promise.allSettled([
          getPublicVendor(vendorId),
          listPublicVendorProducts(vendorId),
        ])

        if (cancelled) return

        const loadedProducts =
          productsResult.status === 'fulfilled' ? productsResult.value.data : []
        setProducts(loadedProducts)

        if (vendorResult.status === 'fulfilled') {
          setVendor(vendorResult.value.data)
          return
        }

        console.error('Vendor profile API failed:', vendorResult.reason)

        if (loadedProducts.length > 0) {
          const sample = loadedProducts[0]
          setVendor({
            id: vendorId,
            name: '',
            businessName: sample.vendorBusinessName,
            businessLocation: '',
            location: '',
            phoneNumber: '',
            email: '',
            pharmacyLicense: '',
            profileImage: null,
            createdAt: '',
          })
          toast.warn('Showing limited vendor info. Restart the backend for full profile details.')
          return
        }

        setError('Could not load vendor profile.')
      } catch (err) {
        if (!cancelled) {
          setError('Could not load vendor profile.')
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
  }, [vendorId])

  const logoUrl = vendor?.profileImage ? resolveProfileImageUrl(vendor.profileImage) : null
  const showLogo = Boolean(logoUrl && !logoFailed)

  if (loading) {
    return (
      <div className="bg-white">
        <Header />
        <main className="px-4 py-16 text-center text-slate-600 md:px-8">Loading vendor profile...</main>
        <Footer />
        <Copyright />
      </div>
    )
  }

  if (error || !vendor) {
    return (
      <div className="bg-white">
        <Header />
        <main className="px-4 py-16 text-center md:px-8">
          <p className="text-slate-600">{error ?? 'Vendor not found.'}</p>
          <button
            className="mt-4 rounded-lg bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white"
            onClick={() => navigate('/products')}
            type="button"
          >
            Browse products
          </button>
        </main>
        <Footer />
        <Copyright />
      </div>
    )
  }

  return (
    <div className="bg-slate-50">
      <Header />

      <main className="px-4 py-8 md:px-8">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-5 text-sm text-slate-500">
            <Link to="/">Home</Link>
            <span className="mx-2 text-slate-400">/</span>
            <Link to="/products">Products</Link>
            <span className="mx-2 text-slate-400">/</span>
            <span className="font-medium text-slate-700">{vendor.businessName}</span>
          </div>

          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-6 md:px-8">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div className="flex flex-wrap items-center gap-5">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-teal-50">
                    {showLogo ? (
                      <img
                        alt={`${vendor.businessName} logo`}
                        className="h-full w-full object-cover"
                        onError={() => setLogoFailed(true)}
                        src={logoUrl!}
                      />
                    ) : (
                      <span className="text-2xl font-bold text-teal-700">{shopInitial(vendor.businessName)}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h1 className="text-2xl font-bold text-slate-900">{vendor.businessName}</h1>
                    {vendor.name ? (
                      <p className="mt-1.5 text-sm text-slate-600">
                        Managed by <span className="font-semibold text-slate-900">{vendor.name}</span>
                      </p>
                    ) : null}
                    <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
                      <FiMapPin aria-hidden="true" className="h-4 w-4 shrink-0" />
                      {vendor.businessLocation || vendor.location || 'Location not listed'}
                    </p>
                    {vendor.phoneNumber ? (
                      <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600">
                        <FiPhone aria-hidden="true" className="h-4 w-4 shrink-0" />
                        {vendor.phoneNumber}
                      </p>
                    ) : null}
                    {vendor.createdAt ? (
                      <p className="mt-1 text-xs text-slate-500">Member since {formatYear(vendor.createdAt)}</p>
                    ) : null}
                  </div>
                </div>

                <span
                  aria-hidden="true"
                  className="ml-auto mt-6 inline-flex shrink-0 items-center gap-2 self-start rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-sm"
                >
                  <FiMail className="h-4 w-4" />
                  Message
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 px-5 py-5 md:grid-cols-2 md:px-8">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h2 className="text-sm font-semibold text-slate-900">Contact Information</h2>
                <dl className="mt-3 space-y-2 text-sm">
                  {vendor.name ? (
                    <div className="flex justify-between gap-4">
                      <dt className="font-medium text-slate-600">Owner</dt>
                      <dd className="text-right text-slate-800">{vendor.name}</dd>
                    </div>
                  ) : null}
                  <div className="flex justify-between gap-4">
                    <dt className="font-medium text-slate-600">Email</dt>
                    <dd className="text-right text-slate-800">{vendor.email || '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="font-medium text-slate-600">Phone</dt>
                    <dd className="text-right text-slate-800">{vendor.phoneNumber || '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="font-medium text-slate-600">Location</dt>
                    <dd className="text-right text-slate-800">{vendor.location || '—'}</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h2 className="text-sm font-semibold text-slate-900">Business Details</h2>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="font-medium text-slate-600">Business Name</dt>
                    <dd className="text-right text-slate-800">{vendor.businessName}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="font-medium text-slate-600">Business Location</dt>
                    <dd className="text-right text-slate-800">{vendor.businessLocation || '—'}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="font-medium text-slate-600">Pharmacy License</dt>
                    <dd className="text-right text-slate-800">{vendor.pharmacyLicense || '—'}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="border-t border-slate-100 px-6 py-8 md:px-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-slate-900">Products</h2>
                <p className="mt-1 text-sm text-slate-600">
                  {products.length} {products.length === 1 ? 'item' : 'items'} from this vendor
                </p>
              </div>

              {products.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                  This vendor has no active products right now.
                </p>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {products.map((product) => {
                    const image = getFirstProductImageUrl(product.images)
                    return (
                      <Link
                        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-md"
                        key={product.id}
                        to={`/productsdetail?id=${product.id}`}
                      >
                        {image ? (
                          <img
                            alt={product.productName}
                            className="h-44 w-full bg-white object-contain p-3"
                            src={image}
                          />
                        ) : (
                          <div className="flex h-44 w-full items-center justify-center bg-slate-100 text-sm text-slate-400">
                            No image
                          </div>
                        )}
                        <div className="p-4">
                          <h3 className="line-clamp-2 text-base font-bold text-slate-900">{product.productName}</h3>
                          <p className="mt-1 text-xs text-slate-500">
                            {product.category} · {product.form}
                          </p>
                          <p className="mt-2 text-lg font-bold text-teal-700">
                            NRP {Number(product.price).toLocaleString()}
                          </p>
                          <div className="mt-2 grid grid-cols-3 gap-3 text-[11px]">
                            <div>
                              <p className="uppercase tracking-wide text-slate-400">Strength</p>
                              <p className="mt-1 text-xs font-semibold text-slate-700">{product.strength}</p>
                            </div>
                            <div>
                              <p className="uppercase tracking-wide text-slate-400">Form</p>
                              <p className="mt-1 text-xs font-semibold text-slate-700">{product.form}</p>
                            </div>
                            <div>
                              <p className="uppercase tracking-wide text-slate-400">Quantity</p>
                              <p className="mt-1 text-xs font-semibold text-slate-700">{product.quantity}</p>
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      </main>

      <Footer />
      <Copyright />
    </div>
  )
}

export default VendorProfile
