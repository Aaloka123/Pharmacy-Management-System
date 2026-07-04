import AdminNavbar from '../AdminComponents/AdminNavbar'
import CertificatePreviewModal from '../components/CertificatePreviewModal'
import { AdminLayout, AdminMain, FadeInOnScroll } from '../components/PortalMain'
import { useEffect, useState } from 'react'
import { FaStar } from 'react-icons/fa'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { api, ApiRequestError, resolveBackendUrl } from '../lib/api'
import { listVendorProductsByVendorId, type ProductDto } from '../lib/productsApi'
import { getProductExpiryStatus } from '../lib/vendorNavBadges'
import {
  toApiStoreStatus,
  toDisplayStoreStatus,
  updateVendorStoreStatus,
  type ApiStoreStatus,
} from '../lib/vendorsApi'

type VendorDetail = {
  id: number
  name: string
  email: string
  phoneNumber: string
  location: string
  businessPanVatId: string
  businessName: string
  businessLocation: string
  pharmacyLicense: string
  pharmacyManagementCertificate: string
  panVatCertificate: string
  profileImage: string | null
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  storeStatus: ApiStoreStatus
  storeLockedByAdmin: boolean
  createdAt: string
  decidedAt: string | null
}

type VendorProductRow = {
  id: number
  sku: string
  name: string
  category: string
  stock: number
  price: number
  expiryDate: string
  status: string
  image: string | null
}

const mapProductRow = (dto: ProductDto): VendorProductRow => ({
  id: dto.id,
  sku: dto.sku,
  name: dto.productName,
  category: dto.category,
  stock: dto.stock,
  price: Number(dto.price),
  expiryDate: dto.expiryDate,
  status: dto.status === 'ACTIVE' ? 'Active' : 'Inactive',
  image: dto.images.length > 0 ? resolveBackendUrl(dto.images[0]) : null,
})

const formatYear = (iso: string | null | undefined): string => {
  if (!iso) return '—'
  const year = new Date(iso).getFullYear()
  return Number.isNaN(year) ? '—' : String(year)
}

const formatDateTime = (iso: string | null | undefined): string => {
  if (!iso) return '—'
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString()
}

const formatExpiryDate = (dateStr: string): string => {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  return Number.isNaN(date.getTime()) ? dateStr : date.toLocaleDateString()
}

const shopInitial = (shopName: string): string => {
  const trimmed = shopName.trim()
  if (!trimmed) return '?'
  return trimmed[0].toUpperCase()
}

const VENDOR_RATING = 4

const VendorStarRating = ({ rating }: { rating: number }) => (
  <div aria-label={`${rating} out of 5 stars`} className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((star) => (
      <FaStar
        key={star}
        className={`h-4 w-4 ${star <= rating ? 'text-amber-400' : 'text-slate-300'}`}
      />
    ))}
  </div>
)

const AdminVendorProfile = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const vendorId = (location.state as { vendorId?: number } | null)?.vendorId

  const [vendor, setVendor] = useState<VendorDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCertificate, setSelectedCertificate] = useState<{ title: string; src: string } | null>(null)
  const [profileImageFailed, setProfileImageFailed] = useState(false)
  const [vendorProducts, setVendorProducts] = useState<VendorProductRow[]>([])
  const [productsLoading, setProductsLoading] = useState(false)
  const [isUpdatingStoreStatus, setIsUpdatingStoreStatus] = useState(false)

  useEffect(() => {
    setProfileImageFailed(false)
  }, [vendor?.profileImage, vendor?.id])

  useEffect(() => {
    if (vendorId == null) {
      setLoading(false)
      setError('No vendor selected. Open a vendor from the vendors list.')
      return
    }

    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data } = await api.get<VendorDetail>(`/api/vendors/${vendorId}`)
        if (!cancelled) {
          setVendor(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError('Could not load vendor profile.')
          toast.error('Failed to load vendor details.')
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

  useEffect(() => {
    if (vendorId == null) {
      setVendorProducts([])
      return
    }

    let cancelled = false
    const loadProducts = async () => {
      setProductsLoading(true)
      try {
        const { data } = await listVendorProductsByVendorId(vendorId)
        if (!cancelled) {
          setVendorProducts(data.map(mapProductRow))
        }
      } catch (err) {
        if (!cancelled) {
          setVendorProducts([])
          toast.error('Failed to load vendor products.')
          console.error(err)
        }
      } finally {
        if (!cancelled) setProductsLoading(false)
      }
    }
    void loadProducts()
    return () => {
      cancelled = true
    }
  }, [vendorId])

  const totalProductCount = vendorProducts.length
  const totalStockUnits = vendorProducts.reduce((sum, product) => sum + product.stock, 0)
  const totalInventoryValue = vendorProducts.reduce((sum, product) => sum + product.stock * product.price, 0)

  const certificateDocs = vendor
    ? [
        {
          title: 'Pharmacy Management Certificate',
          documentId: vendor.pharmacyLicense,
          imageUrl: resolveBackendUrl(vendor.pharmacyManagementCertificate),
        },
        {
          title: 'PAN / VAT Certificate',
          documentId: vendor.businessPanVatId,
          imageUrl: resolveBackendUrl(vendor.panVatCertificate),
        },
      ]
    : []

  const profileImageUrl =
    vendor?.profileImage?.trim() ? resolveBackendUrl(vendor.profileImage) : null
  const showProfileImage = Boolean(profileImageUrl) && !profileImageFailed
  const storeStatus = vendor ? toDisplayStoreStatus(vendor.storeStatus ?? 'OPEN') : 'Open'

  const handleStoreStatusChange = async () => {
    if (!vendor || vendor.status !== 'APPROVED') return

    const nextStatus = storeStatus === 'Open' ? 'Close' : 'Open'
    const confirmed = window.confirm(`Do you want to change this vendor's store status to ${nextStatus}?`)
    if (!confirmed) return

    setIsUpdatingStoreStatus(true)
    try {
      const { data } = await updateVendorStoreStatus(vendor.id, toApiStoreStatus(nextStatus))
      setVendor((current) =>
        current
          ? {
              ...current,
              storeStatus: data.storeStatus,
              storeLockedByAdmin: data.storeLockedByAdmin,
            }
          : current,
      )
      toast.success(
        nextStatus === 'Close' ? 'Vendor store has been closed.' : 'Vendor store has been opened.',
      )
    } catch (err) {
      if (err instanceof ApiRequestError) {
        toast.error('Failed to update store status.')
      } else {
        toast.error('Could not reach the server.')
      }
      console.error(err)
    } finally {
      setIsUpdatingStoreStatus(false)
    }
  }

  const handlePrintCertificate = () => {
    if (!selectedCertificate) return

    const printWindow = window.open('', '_blank', 'noopener,noreferrer,width=900,height=700')
    if (!printWindow) return

    printWindow.document.write(`
      <html>
        <head>
          <title>${selectedCertificate.title}</title>
          <style>
            body { margin: 0; padding: 24px; font-family: Arial, sans-serif; }
            .container { max-width: 1000px; margin: 0 auto; }
            h2 { margin: 0 0 16px; font-size: 20px; }
            img { width: 100%; height: auto; border: 1px solid #e2e8f0; border-radius: 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <h2>${selectedCertificate.title}</h2>
            <img src="${selectedCertificate.src}" alt="${selectedCertificate.title}" />
          </div>
          <script>window.onload = function () { window.print(); };</script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const handleSaveCertificate = () => {
    if (!selectedCertificate) return

    const downloadLink = document.createElement('a')
    downloadLink.href = selectedCertificate.src
    downloadLink.download = `${selectedCertificate.title.replace(/\s+/g, '-').toLowerCase()}.jpg`
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
  }

  return (
    <AdminLayout>
      <AdminNavbar />
      <AdminMain>
      <FadeInOnScroll>
        <Link
          to="/adminvendors"
          className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 transition hover:text-teal-800"
        >
          <span aria-hidden>←</span>
          Back to Vendors
        </Link>

        {loading ? (
          <p className="mt-8 text-center text-sm text-slate-600">Loading vendor profile…</p>
        ) : error || !vendor ? (
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-slate-600">{error ?? 'Vendor not found.'}</p>
            <button
              type="button"
              className="cursor-pointer mt-4 text-sm font-semibold text-teal-700 hover:text-teal-800"
              onClick={() => navigate('/adminvendors')}
            >
              Go to vendors list
            </button>
          </div>
        ) : (
          <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-6 py-6">
              <div className="flex flex-wrap items-center gap-5">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-teal-50">
                  {showProfileImage && profileImageUrl ? (
                    <img
                      alt={`${vendor.businessName} logo`}
                      className="h-full w-full object-cover"
                      src={profileImageUrl}
                      onError={() => setProfileImageFailed(true)}
                    />
                  ) : (
                    <span
                      className="text-2xl font-bold text-teal-700"
                      aria-hidden
                    >
                      {shopInitial(vendor.businessName)}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{vendor.businessName}</h2>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <VendorStarRating rating={VENDOR_RATING} />
                    <span className="text-sm font-semibold text-slate-800">{VENDOR_RATING}.0</span>
                  </div>
                  <p className="mt-1.5 text-base text-slate-600">
                    Managed by <span className="font-semibold text-slate-900">{vendor.name}</span>
                  </p>
                  <p className="mt-1 text-base text-slate-600">Email: {vendor.email}</p>
                  <p className="mt-1 text-base text-slate-600">Phone: {vendor.phoneNumber}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 px-5 py-5 md:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900">Contact Information</h3>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="font-medium text-slate-600">Owner Name</dt>
                    <dd className="text-slate-800">{vendor.name}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="font-medium text-slate-600">Email</dt>
                    <dd className="text-slate-800">{vendor.email}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="font-medium text-slate-600">Phone</dt>
                    <dd className="text-slate-800">{vendor.phoneNumber}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="font-medium text-slate-600">Personal Location</dt>
                    <dd className="text-slate-800">{vendor.location}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="font-medium text-slate-600">Business Address</dt>
                    <dd className="text-right text-slate-800">{vendor.businessLocation}</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900">Business Details</h3>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="font-medium text-slate-600">Shop Name</dt>
                    <dd className="text-slate-800">{vendor.businessName}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="font-medium text-slate-600">Pharmacy License</dt>
                    <dd className="text-slate-800">{vendor.pharmacyLicense}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="font-medium text-slate-600">PAN / VAT ID</dt>
                    <dd className="text-slate-800">{vendor.businessPanVatId}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="font-medium text-slate-600">Registered</dt>
                    <dd className="text-slate-800">{formatYear(vendor.createdAt)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="font-medium text-slate-600">Submitted</dt>
                    <dd className="text-right text-slate-800">{formatDateTime(vendor.createdAt)}</dd>
                  </div>
                  {vendor.decidedAt && (
                    <div className="flex justify-between gap-4">
                      <dt className="font-medium text-slate-600">Decision Date</dt>
                      <dd className="text-right text-slate-800">{formatDateTime(vendor.decidedAt)}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

            <div className="border-t border-slate-200 px-5 py-5">
              <h3 className="text-sm font-semibold text-slate-900">Certificates</h3>
              <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
                {certificateDocs.map((certificate) => (
                  <div key={certificate.title} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="mb-1 text-sm font-semibold text-slate-800">{certificate.title}</p>
                    <p className="mb-2 text-xs text-slate-500">Reference: {certificate.documentId}</p>
                    <button
                      className="cursor-pointer w-full"
                      onClick={() =>
                        setSelectedCertificate({
                          title: certificate.title,
                          src: certificate.imageUrl,
                        })
                      }
                      type="button"
                    >
                      <img
                        src={certificate.imageUrl}
                        alt={certificate.title}
                        className="h-64 w-full rounded-md border border-slate-200 object-contain bg-white"
                      />
                    </button>

                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        className="cursor-pointer rounded-md border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700"
                        onClick={() =>
                          setSelectedCertificate({
                            title: certificate.title,
                            src: certificate.imageUrl,
                          })
                        }
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-200 px-5 py-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-slate-900">Vendor Products</h3>
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                  <span className="rounded-full bg-teal-50 px-3 py-1 text-teal-700">
                    Products: {totalProductCount}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700">
                    Total Stock: {totalStockUnits} units
                  </span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                    Inventory Value: NPR {totalInventoryValue.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full text-left">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-700">No.</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-700">Image</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-700">Product</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-700">SKU</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-700">Category</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-700">Price (NPR)</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-700">Stock</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-700">Expiry Date</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-700">Expiry Status</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productsLoading ? (
                      <tr>
                        <td className="px-4 py-6 text-sm text-slate-500" colSpan={10}>
                          Loading products...
                        </td>
                      </tr>
                    ) : null}
                    {!productsLoading && vendorProducts.length === 0 ? (
                      <tr>
                        <td className="px-4 py-6 text-sm text-slate-500" colSpan={10}>
                          No products listed by this vendor yet.
                        </td>
                      </tr>
                    ) : null}
                    {!productsLoading
                      ? vendorProducts.map((product, index) => {
                      const expiryStatus = getProductExpiryStatus(product.expiryDate)
                      const expired = expiryStatus.label === 'Expired'
                      return (
                      <tr
                        key={product.id}
                        className={`border-t border-slate-200 ${expired ? 'bg-rose-50/70' : ''}`}
                      >
                        <td className="px-4 py-3 text-sm text-slate-700">{index + 1}</td>
                        <td className="px-4 py-3">
                          {product.image ? (
                            <img
                              src={product.image}
                              alt={product.name}
                              className="h-10 w-10 rounded-md border border-slate-200 object-cover"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-100 text-xs text-slate-400">
                              —
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-800">{product.name}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{product.sku}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{product.category}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{product.price.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{product.stock}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">
                          {formatExpiryDate(product.expiryDate)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${expiryStatus.classes}`}
                          >
                            {expiryStatus.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                              product.status === 'Active'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {product.status}
                          </span>
                        </td>
                      </tr>
                    )})
                      : null}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-t border-slate-200 px-5 py-5">
              <h3 className="text-base font-semibold text-slate-900">Store Status</h3>
              {vendor.status === 'APPROVED' ? (
                <button
                  className={`cursor-pointer mt-3 w-full rounded-lg px-4 py-2 text-center text-sm font-semibold text-white disabled:opacity-60 ${
                    storeStatus === 'Open'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                  disabled={isUpdatingStoreStatus}
                  onClick={() => void handleStoreStatusChange()}
                  type="button"
                >
                  {isUpdatingStoreStatus
                    ? 'Updating…'
                    : storeStatus === 'Open'
                      ? 'Temporarily Close Shop'
                      : 'Open Shop'}
                </button>
              ) : null}
            </div>
          </section>
        )}
      </FadeInOnScroll>
      </AdminMain>

      {selectedCertificate && (
        <CertificatePreviewModal
          onClose={() => setSelectedCertificate(null)}
          onDownload={handleSaveCertificate}
          onPrint={handlePrintCertificate}
          src={selectedCertificate.src}
          title={selectedCertificate.title}
        />
      )}
    </AdminLayout>
  )
}

export default AdminVendorProfile
