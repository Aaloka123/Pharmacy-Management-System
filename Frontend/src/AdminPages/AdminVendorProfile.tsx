import AdminNavbar from '../AdminComponents/AdminNavbar'
import mednexuxLogo from '../assets/Mednexux.png'
import { Link } from 'react-router-dom'
import businessRegistrationCertificate from '../assets/BussinessRegestratorCertificate.jpg'
import panCertificate from '../assets/panCertificate.jpg'
import { useState } from 'react'
import medicineImage from '../assets/Hero2.jpg'

const vendorProfile = {
  shopName: 'Himalaya Pharmacy',
  ownerName: 'Ramesh Koirala',
  email: 'himalaya.pharmacy@gmail.com',
  phone: '+977-9801112233',
  location: 'Kathmandu, Nepal',
  address: 'Putalisadak-12, Kathmandu',
  panNumber: 'PAN-784512369',
  registrationNumber: 'REG-NP-HP-1023',
  establishedYear: '2018',
  status: 'Open',
  openingHours: '8:00 AM - 9:00 PM',
} as const

const vendorProducts = [
  { id: 1, sku: 'MED-PARA-500', name: 'Paracetamol 500mg', category: 'Tablet', stock: 120, price: 60, sold: 420, expiryDate: '2027-06-30', image: medicineImage },
  { id: 2, sku: 'SUP-VITC-100', name: 'Vitamin C Capsules', category: 'Supplement', stock: 80, price: 350, sold: 185, expiryDate: '2028-01-15', image: medicineImage },
  { id: 3, sku: 'SYP-COUGH-150', name: 'Cough Syrup', category: 'Syrup', stock: 45, price: 180, sold: 130, expiryDate: '2026-11-20', image: medicineImage },
  { id: 4, sku: 'DEV-THERMO-01', name: 'Digital Thermometer', category: 'Medical Device', stock: 25, price: 650, sold: 70, expiryDate: 'N/A', image: medicineImage },
]

const certificateDocs = [
  {
    title: 'Business Registration Certificate',
    documentId: 'BRC-HP-2024-119',
    fileName: 'business-registration-certificate.jpg',
    imageUrl: businessRegistrationCertificate,
  },
  {
    title: 'PAN / VAT Certificate',
    documentId: 'PANVAT-784512369',
    fileName: 'pan-vat-certificate.jpg',
    imageUrl: panCertificate,
  },
]

const AdminVendorProfile = () => {
  const [selectedCertificate, setSelectedCertificate] = useState<{ title: string; src: string } | null>(null)
  const [storeStatus, setStoreStatus] = useState<'Open' | 'Close'>(vendorProfile.status)
  const totalSalesCount = vendorProducts.reduce((sum, product) => sum + product.sold, 0)
  const totalSalesAmount = vendorProducts.reduce((sum, product) => sum + product.sold * product.price, 0)

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
            body {
              margin: 0;
              padding: 24px;
              font-family: Arial, sans-serif;
            }
            .container {
              max-width: 1000px;
              margin: 0 auto;
            }
            h2 {
              margin: 0 0 16px;
              font-size: 20px;
            }
            img {
              width: 100%;
              height: auto;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
            }
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

        <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-slate-200 bg-white p-2">
                <img alt="Vendor logo" className="h-full w-full object-contain" src={mednexuxLogo} />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{vendorProfile.shopName}</h2>
                <p className="mt-1 text-sm text-slate-600">Managed by {vendorProfile.ownerName}</p>
                <p className="mt-1 text-sm text-slate-600">Email: {vendorProfile.email}</p>
                <p className="mt-1 text-sm text-slate-600">Phone: {vendorProfile.phone}</p>
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-600">Status:</span>
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                      storeStatus === 'Open' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    <span
                      className={`h-2 w-2 rounded-full ${
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
                  <dd className="text-slate-800">{vendorProfile.ownerName}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="font-medium text-slate-600">Email</dt>
                  <dd className="text-slate-800">{vendorProfile.email}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="font-medium text-slate-600">Phone</dt>
                  <dd className="text-slate-800">{vendorProfile.phone}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="font-medium text-slate-600">Location</dt>
                  <dd className="text-slate-800">{vendorProfile.location}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="font-medium text-slate-600">Address</dt>
                  <dd className="text-right text-slate-800">{vendorProfile.address}</dd>
                </div>
              </dl>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 className="text-sm font-semibold text-slate-900">Business Details</h3>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="font-medium text-slate-600">Shop Name</dt>
                  <dd className="text-slate-800">{vendorProfile.shopName}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="font-medium text-slate-600">Registration No.</dt>
                  <dd className="text-slate-800">{vendorProfile.registrationNumber}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="font-medium text-slate-600">PAN Number</dt>
                  <dd className="text-slate-800">{vendorProfile.panNumber}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="font-medium text-slate-600">Established</dt>
                  <dd className="text-slate-800">{vendorProfile.establishedYear}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="font-medium text-slate-600">Opening Hours</dt>
                  <dd className="text-slate-800">{vendorProfile.openingHours}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="border-t border-slate-200 px-5 py-5">
            <h3 className="text-sm font-semibold text-slate-900">Certificates</h3>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              {certificateDocs.map((certificate) => (
                <div key={certificate.documentId} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <p className="mb-1 text-sm font-semibold text-slate-800">{certificate.title}</p>
                  <p className="mb-2 text-xs text-slate-500">Document ID: {certificate.documentId}</p>
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