import AdminNavbar from '../AdminComponents/AdminNavbar'
import businessCertificate from '../assets/BussinessRegestratorCertificate.jpg'
import panCertificate from '../assets/panCertificate.jpg'
import { useMemo, useState } from 'react'

const vendorsForApproval = [
  {
    id: 1,
    businessPanVatId: '605982486',
    businessName: 'Lucky Human Resource Pvt. Ltd.',
    businessLocation: 'Ward No. 07, Mitrapark, Kathmandu',
    contactEmail: 'luckyhumanresource@gmail.com',
    locationPhoneNumber: '+977-9812345678',
    userName: 'luckyadmin',
    submittedAgo: '1 min ago',
  },
  {
    id: 2,
    businessPanVatId: '609774320',
    businessName: 'Evergreen Medico Suppliers',
    businessLocation: 'New Baneshwor, Kathmandu',
    contactEmail: 'evergreen.medico@gmail.com',
    locationPhoneNumber: '+977-9861234567',
    userName: 'evergreenvendor',
    submittedAgo: '8 min ago',
  },
]

const AdminApproveVendor = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCertificate, setSelectedCertificate] = useState<{ title: string; src: string } | null>(null)

  const filteredVendors = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    if (!normalizedQuery) {
      return vendorsForApproval
    }

    return vendorsForApproval.filter((vendor) => {
      const searchableValues = [
        vendor.businessPanVatId,
        vendor.businessName,
        vendor.businessLocation,
        vendor.contactEmail,
        vendor.locationPhoneNumber,
        vendor.userName,
      ]
      return searchableValues.some((value) => value.toLowerCase().includes(normalizedQuery))
    })
  }, [searchQuery])

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
    link.download = `${selectedCertificate.title.replace(/\s+/g, '-').toLowerCase()}.jpg`
    link.click()
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminNavbar />
      <main className="flex-1 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Approve Vendor</h1>
            <p className="mt-1 text-sm text-slate-600">Review vendor documents and approve valid business registrations.</p>
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
          {filteredVendors.map((vendor) => (
            <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm" key={vendor.id}>
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600">#{vendor.id}</span>
                      <h2 className="text-lg font-semibold text-slate-900">{vendor.businessName}</h2>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">Submitted {vendor.submittedAgo}</span>
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
                    <span className="font-semibold text-slate-900">Contact Email:</span> {vendor.contactEmail}
                  </p>
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">Location Phone Number:</span> {vendor.locationPhoneNumber}
                  </p>
                  <p className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-900">User Name:</span> {vendor.userName}
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Business Registration Certificate</p>
                    <button
                      className="w-full"
                      onClick={() =>
                        setSelectedCertificate({
                          title: 'Business Registration Certificate',
                          src: businessCertificate,
                        })
                      }
                      type="button"
                    >
                      <img alt="Business registration certificate" className="h-64 w-full rounded-md border border-slate-200 object-cover" src={businessCertificate} />
                    </button>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">PAN / VAT Certificate</p>
                    <button
                      className="w-full"
                      onClick={() =>
                        setSelectedCertificate({
                          title: 'PAN / VAT Certificate',
                          src: panCertificate,
                        })
                      }
                      type="button"
                    >
                      <img alt="PAN certificate" className="h-64 w-full rounded-md border border-slate-200 object-cover" src={panCertificate} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-5 flex gap-3">
                <button className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white" type="button">
                  <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white text-emerald-600">
                    <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path d="m5 12 5 5L19 8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  Approve Vendor
                </button>
                <button className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-600" type="button">
                  <svg className="size-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M8.25 12h7.5m-7.5 4h4.5M6.75 4.5h10.5A2.25 2.25 0 0 1 19.5 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H6.75a2.25 2.25 0 0 1-2.25-2.25V6.75A2.25 2.25 0 0 1 6.75 4.5Z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Request More Detail
                </button>
                <button className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600" type="button">
                  <svg className="size-5" fill="none" stroke="currentColor" strokeWidth={2.6} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path d="M6 18 18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Reject Request
                </button>
              </div>
            </article>
          ))}
          {filteredVendors.length === 0 && (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-600 shadow-sm">
              No vendor requests found for this search.
            </div>
          )}
        </section>
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
                onClick={handleDownloadCertificate}
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

export default AdminApproveVendor