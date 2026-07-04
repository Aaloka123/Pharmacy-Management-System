import AdminNavbar from '../AdminComponents/AdminNavbar'
import CertificatePreviewModal from '../components/CertificatePreviewModal'
import { AdminLayout, AdminMain, FadeInOnScroll } from '../components/PortalMain'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'
import { api } from '../lib/api'

type VendorStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

type Vendor = {
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
  status: VendorStatus
  createdAt: string
  decidedAt: string | null
}

const PENDING_VENDORS_URL = '/api/vendors?status=PENDING'
const PENDING_VENDORS_EVENT = 'mednexus:pending-vendors-changed'

const formatSubmittedAgo = (iso: string): string => {
  const submittedAt = new Date(iso).getTime()
  if (Number.isNaN(submittedAt)) return 'recently'
  const diffMs = Date.now() - submittedAt
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

const AdminApproveVendor = () => {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [actionId, setActionId] = useState<number | null>(null)
  const [selectedCertificate, setSelectedCertificate] = useState<{ title: string; src: string } | null>(null)
  const [topNotice, setTopNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!topNotice) return undefined
    const timer = window.setTimeout(() => setTopNotice(null), 6000)
    return () => window.clearTimeout(timer)
  }, [topNotice])

  const loadVendors = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get<Vendor[]>(PENDING_VENDORS_URL)
      setVendors(data)
      window.dispatchEvent(new Event(PENDING_VENDORS_EVENT))
    } catch (err) {
      setError('Could not load vendor requests. Is the backend running?')
      toast.error('Failed to load vendor requests.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadVendors()
  }, [loadVendors])

  const filteredVendors = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    if (!normalizedQuery) {
      return vendors
    }

    return vendors.filter((vendor) => {
      const searchableValues = [
        vendor.businessPanVatId,
        vendor.businessName,
        vendor.businessLocation,
        vendor.email,
        vendor.phoneNumber,
        vendor.name,
      ]
      return searchableValues.some((value) => value.toLowerCase().includes(normalizedQuery))
    })
  }, [searchQuery, vendors])

  const handleDecision = async (vendor: Vendor, decision: 'approve' | 'reject') => {
    if (decision === 'reject') {
      const confirmed = window.confirm(`Reject ${vendor.businessName}? The vendor will be notified by email.`)
      if (!confirmed) return
    }

    setActionId(vendor.id)
    try {
      await api.post(`/api/vendors/${vendor.id}/${decision}`)
      setVendors((prev) => prev.filter((v) => v.id !== vendor.id))
      window.dispatchEvent(new Event(PENDING_VENDORS_EVENT))
      if (decision === 'reject') {
        setTopNotice(`${vendor.businessName} was rejected. The vendor has been notified by email.`)
        toast.warn(`${vendor.businessName} rejected.`, { position: 'top-center' })
      } else {
        setTopNotice(null)
        toast.success(`${vendor.businessName} approved. The vendor will receive a welcome email.`, {
          position: 'top-center',
        })
      }
    } catch (err) {
      toast.error(
        decision === 'approve' ? 'Failed to approve vendor.' : 'Failed to reject vendor.',
        { position: 'top-center' },
      )
      console.error(err)
    } finally {
      setActionId(null)
    }
  }

  const handlePrintCertificate = () => {
    if (!selectedCertificate) {
      return
    }

    const printWindow = window.open('', '_blank', 'width=1000,height=800')
    if (!printWindow) {
      return
    }

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
          <script>
            window.onload = function () { window.print(); };
          </script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const handleDownloadCertificate = () => {
    if (!selectedCertificate) {
      return
    }

    const link = document.createElement('a')
    link.href = selectedCertificate.src
    link.download = `${selectedCertificate.title.replace(/\s+/g, '-').toLowerCase()}`
    link.click()
  }

  return (
    <AdminLayout>
      <AdminNavbar />
      <AdminMain>
      <FadeInOnScroll>
        {topNotice ? (
          <div
            className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 shadow-sm"
            role="status"
          >
            <div className="flex items-start gap-2">
              <svg aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-rose-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M6 18 18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="font-medium">{topNotice}</p>
            </div>
            <button
              aria-label="Dismiss notification"
              className="cursor-pointer shrink-0 rounded-md p-1 text-rose-600 transition hover:bg-rose-100"
              onClick={() => setTopNotice(null)}
              type="button"
            >
              <svg aria-hidden="true" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path d="M6 18 18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Approve Vendor</h1>
            <p className="mt-1 text-sm text-slate-600">
              Review vendor documents and approve valid business registrations.
              {!loading && !error ? (
                <span className="ml-2 text-slate-500">({vendors.length} pending)</span>
              ) : null}
            </p>
          </div>
          <input
            className="w-72 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-600"
            placeholder="Search by business, PAN/VAT, email..."
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>

        <section className="mt-6 space-y-5">
          {loading ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600 shadow-sm">
              Loading vendor requests…
            </div>
          ) : error ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">
              {error}
            </div>
          ) : filteredVendors.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600 shadow-sm">
              No vendor requests found.
            </div>
          ) : (
            filteredVendors.map((vendor) => (
              <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm" key={vendor.id}>
                <div className="grid gap-6 lg:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600">#{vendor.id}</span>
                        <h2 className="text-lg font-semibold text-slate-900">{vendor.businessName}</h2>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                        Submitted {formatSubmittedAgo(vendor.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Business PAN / VAT ID:</span> {vendor.businessPanVatId}
                    </p>
                    <p className="text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Business Name:</span> {vendor.businessName}
                    </p>
                    <p className="text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Business Location:</span> {vendor.businessLocation}
                    </p>
                    <p className="text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Pharmacy License:</span> {vendor.pharmacyLicense}
                    </p>
                    <p className="text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Contact Email:</span> {vendor.email}
                    </p>
                    <p className="text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Phone Number:</span> {vendor.phoneNumber}
                    </p>
                    <p className="text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Personal Location:</span> {vendor.location}
                    </p>
                    <p className="text-sm text-slate-700">
                      <span className="font-semibold text-slate-900">Name:</span> {vendor.name}
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Pharmacy Management Certificate</p>
                      <button
                        className="cursor-pointer w-full"
                        onClick={() =>
                          setSelectedCertificate({
                            title: 'Pharmacy Management Certificate',
                            src: vendor.pharmacyManagementCertificate,
                          })
                        }
                        type="button"
                      >
                        <img
                          alt="Pharmacy management certificate"
                          className="h-64 w-full rounded-md border border-slate-200 object-cover"
                          src={vendor.pharmacyManagementCertificate}
                        />
                      </button>
                    </div>
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">PAN / VAT Certificate</p>
                      <button
                        className="cursor-pointer w-full"
                        onClick={() =>
                          setSelectedCertificate({
                            title: 'PAN / VAT Certificate',
                            src: vendor.panVatCertificate,
                          })
                        }
                        type="button"
                      >
                        <img
                          alt="PAN certificate"
                          className="h-64 w-full rounded-md border border-slate-200 object-cover"
                          src={vendor.panVatCertificate}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-5 flex gap-3">
                  <button
                    className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-60"
                    type="button"
                    disabled={actionId === vendor.id}
                    onClick={() => handleDecision(vendor, 'approve')}
                  >
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-emerald-600">
                      <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path d="m5 12 5 5L19 8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    {actionId === vendor.id ? 'Working…' : 'Approve Vendor'}
                  </button>
                  <button
                    className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-600"
                    type="button"
                  >
                    <svg className="size-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8.25 12h7.5m-7.5 4h4.5M6.75 4.5h10.5A2.25 2.25 0 0 1 19.5 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H6.75a2.25 2.25 0 0 1-2.25-2.25V6.75A2.25 2.25 0 0 1 6.75 4.5Z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Request More Detail
                  </button>
                  <button
                    className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
                    type="button"
                    disabled={actionId === vendor.id}
                    onClick={() => handleDecision(vendor, 'reject')}
                  >
                    <svg className="size-5" fill="none" stroke="currentColor" strokeWidth={2.6} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="M6 18 18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {actionId === vendor.id ? 'Working…' : 'Reject Request'}
                  </button>
                </div>
              </article>
            ))
          )}
        </section>
      </FadeInOnScroll>
      </AdminMain>

      {selectedCertificate && (
        <CertificatePreviewModal
          onClose={() => setSelectedCertificate(null)}
          onDownload={handleDownloadCertificate}
          onPrint={handlePrintCertificate}
          src={selectedCertificate.src}
          title={selectedCertificate.title}
        />
      )}
    </AdminLayout>
  )
}

export default AdminApproveVendor
