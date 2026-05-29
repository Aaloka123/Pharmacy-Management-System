import AdminNavbar from '../AdminComponents/AdminNavbar'
import medicineImage from '../assets/Hero2.jpg'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { api, resolveBackendUrl } from '../lib/api'

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
  createdAt: string
  decidedAt: string | null
}

const vendorProducts = [
  { id: 1, sku: 'MED-PARA-500', name: 'Paracetamol 500mg', category: 'Tablet', stock: 120, price: 60, sold: 420, expiryDate: '2027-06-30', image: medicineImage },
  { id: 2, sku: 'SUP-VITC-100', name: 'Vitamin C Capsules', category: 'Supplement', stock: 80, price: 350, sold: 185, expiryDate: '2028-01-15', image: medicineImage },
  { id: 3, sku: 'SYP-COUGH-150', name: 'Cough Syrup', category: 'Syrup', stock: 45, price: 180, sold: 130, expiryDate: '2026-11-20', image: medicineImage },
  { id: 4, sku: 'DEV-THERMO-01', name: 'Digital Thermometer', category: 'Medical Device', stock: 25, price: 650, sold: 70, expiryDate: 'N/A', image: medicineImage },
]

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

const shopInitial = (shopName: string): string => {
  const trimmed = shopName.trim()
  if (!trimmed) return '?'
  return trimmed[0].toUpperCase()
}

const AdminVendorProfile = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const vendorId = (location.state as { vendorId?: number } | null)?.vendorId

  const [vendor, setVendor] = useState<VendorDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCertificate, setSelectedCertificate] = useState<{ title: string; src: string } | null>(null)
  const [storeStatus, setStoreStatus] = useState<'Open' | 'Close'>('Open')
  const [profileImageFailed, setProfileImageFailed] = useState(false)

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

  const totalSalesCount = vendorProducts.reduce((sum, product) => sum + product.sold, 0)
  const totalSalesAmount = vendorProducts.reduce((sum, product) => sum + product.sold * product.price, 0)

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

  const handleStoreStatusChange = () => {
    const nextStatus = storeStatus === 'Open' ? 'Close' : 'Open'
    const confirmed = window.confirm(`Do you want to change store status to ${nextStatus}?`)
    if (!confirmed) return
    setStoreStatus(nextStatus)
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
    <div className="flex min-h-screen bg-slate-50">
      <AdminNavbar />
      <main className="flex-1 p-6">
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
              className="mt-4 text-sm font-semibold text-teal-700 hover:text-teal-800"
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
                  <p className="mt-1.5 text-base text-slate-600">
                    Managed by <span className="font-semibold text-slate-900">{vendor.name}</span>
                  </p>
                  <p className="mt-1 text-base text-slate-600">Email: {vendor.email}</p>
                  <p className="mt-1 text-base text-slate-600">Phone: {vendor.phoneNumber}</p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-600">Store:</span>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                        storeStatus === 'Open' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          storeStatus === 'Open' ? 'bg-emerald-500' : 'bg-rose-500'
                        }`}
                      />
                      {storeStatus}
                    </span>
                  </div>
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
                      className="w-full"
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
                        className="rounded-md border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-semibold text-teal-700"
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
                  <span className="rounded-full bg-teal-50 px-3 py-1 text-teal-700">Total Units Sold: {totalSalesCount}</span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                    Total Sales: NPR {totalSalesAmount.toLocaleString()}
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
                      <th className="px-4 py-3 text-xs font-semibold text-slate-700">Units Sold</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendorProducts.map((product, index) => (
                      <tr key={product.id} className="border-t border-slate-200">
                        <td className="px-4 py-3 text-sm text-slate-700">{index + 1}</td>
                        <td className="px-4 py-3">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="h-10 w-10 rounded-md border border-slate-200 object-cover"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-800">{product.name}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{product.sku}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{product.category}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{product.price.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{product.stock}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{product.expiryDate}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{product.sold}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="border-t border-slate-200 px-5 py-5">
              <h3 className="text-sm font-semibold text-slate-900">Store Status</h3>
              <div className="mt-3">
                <button
                  className={`w-full rounded-lg px-4 py-2 text-center text-sm font-semibold text-white ${
                    storeStatus === 'Open' ? 'bg-emerald-600' : 'bg-rose-600'
                  }`}
                  onClick={handleStoreStatusChange}
                  type="button"
                >
                  {storeStatus === 'Open' ? 'Temporarily Close Shop' : 'Open Shop'}
                </button>
              </div>
            </div>
          </section>
        )}
      </main>

      {selectedCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="w-full max-w-5xl rounded-xl bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-900">{selectedCertificate.title}</h3>
              <button
                aria-label="Close preview"
                className="rounded-md border border-slate-300 p-2 text-slate-700"
                onClick={() => setSelectedCertificate(null)}
                type="button"
              >
                <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M6 18 18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <img alt={selectedCertificate.title} className="max-h-[72vh] w-full rounded-md border border-slate-200 object-contain" src={selectedCertificate.src} />
            </div>

            <div className="mt-4 flex gap-3">
              <button
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white"
                onClick={handlePrintCertificate}
                type="button"
              >
                Print
              </button>
              <button
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
                onClick={handleSaveCertificate}
                type="button"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminVendorProfile
