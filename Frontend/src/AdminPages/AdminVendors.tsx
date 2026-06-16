import AdminNavbar from '../AdminComponents/AdminNavbar'
import { AdminLayout, AdminMain, FadeInOnScroll } from '../components/PortalMain'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { api } from '../lib/api'
import { toDisplayStoreStatus, type ApiStoreStatus } from '../lib/vendorsApi'

type VendorApi = {
  id: number
  name: string
  email: string
  phoneNumber: string
  location: string
  businessName: string
  businessLocation: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  storeStatus: ApiStoreStatus
  storeLockedByAdmin?: boolean
}

type VendorRow = {
  id: number
  shopName: string
  ownerName: string
  location: string
  email: string
  phone: string
  storeStatus: 'Open' | 'Close'
}

const APPROVED_VENDORS_URL = '/api/vendors?status=APPROVED'

const toRow = (vendor: VendorApi): VendorRow => ({
  id: vendor.id,
  shopName: vendor.businessName,
  ownerName: vendor.name,
  location: vendor.businessLocation,
  email: vendor.email,
  phone: vendor.phoneNumber,
  storeStatus: toDisplayStoreStatus(vendor.storeStatus ?? 'OPEN'),
})

const AdminVendors = () => {
  const navigate = useNavigate()
  const [vendors, setVendors] = useState<VendorRow[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data } = await api.get<VendorApi[]>(APPROVED_VENDORS_URL)
        if (!cancelled) {
          setVendors(data.map((vendor) => toRow(vendor)))
        }
      } catch (err) {
        if (!cancelled) {
          setError('Could not load vendors. Is the backend running?')
          toast.error('Failed to load approved vendors.')
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

  const filteredVendors = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    if (!normalizedQuery) {
      return vendors
    }

    return vendors.filter((vendor) => {
      const searchableValues = [
        vendor.shopName,
        vendor.ownerName,
        vendor.location,
        vendor.email,
        vendor.phone,
        vendor.storeStatus,
      ]
      return searchableValues.some((value) => value.toLowerCase().includes(normalizedQuery))
    })
  }, [searchQuery, vendors])

  const openProfile = (vendorId: number) => {
    navigate('/adminvendorprofile', { state: { vendorId } })
  }

  return (
    <AdminLayout>
      <AdminNavbar />
      <AdminMain>
      <FadeInOnScroll>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Vendors</h1>
            <p className="mt-1 text-sm text-slate-600">View registered vendors and shop details.</p>
          </div>
          <input
            className="w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-teal-600"
            placeholder="Search vendors..."
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>

        <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          {loading ? (
            <p className="px-5 py-8 text-center text-sm text-slate-600">Loading approved vendors…</p>
          ) : error ? (
            <p className="px-5 py-8 text-center text-sm text-rose-600">{error}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-5 py-3 text-sm font-semibold text-slate-700">No.</th>
                    <th className="px-5 py-3 text-sm font-semibold text-slate-700">Shop Name</th>
                    <th className="px-5 py-3 text-sm font-semibold text-slate-700">Owner Name</th>
                    <th className="px-5 py-3 text-sm font-semibold text-slate-700">Location</th>
                    <th className="px-5 py-3 text-sm font-semibold text-slate-700">Email</th>
                    <th className="px-5 py-3 text-sm font-semibold text-slate-700">Phone</th>
                    <th className="px-5 py-3 text-sm font-semibold text-slate-700">Store Status</th>
                    <th className="px-5 py-3 text-sm font-semibold text-slate-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVendors.map((vendor, index) => (
                    <tr className="border-t border-slate-200" key={vendor.id}>
                      <td className="px-5 py-3 text-sm text-slate-700">{index + 1}</td>
                      <td className="px-5 py-3 text-sm text-slate-800">
                        <button
                          type="button"
                          onClick={() => openProfile(vendor.id)}
                          className="cursor-pointer font-medium text-slate-800 decoration-slate-500 underline-offset-2 hover:underline"
                        >
                          {vendor.shopName}
                        </button>
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-700">{vendor.ownerName}</td>
                      <td className="px-5 py-3 text-sm text-slate-700">{vendor.location}</td>
                      <td className="px-5 py-3 text-sm text-slate-700">{vendor.email}</td>
                      <td className="px-5 py-3 text-sm text-slate-700">{vendor.phone}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                            vendor.storeStatus === 'Open'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          <span
                            className={`h-2 w-2 rounded-full ${
                              vendor.storeStatus === 'Open' ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          {vendor.storeStatus}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <button
                          className="cursor-pointer rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-teal-700"
                          type="button"
                          onClick={() => openProfile(vendor.id)}
                        >
                          View Profile
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredVendors.length === 0 && (
                    <tr className="border-t border-slate-200">
                      <td className="px-5 py-4 text-sm text-slate-500" colSpan={8}>
                        {vendors.length === 0
                          ? 'No approved vendors yet. Approve vendors from Approve Vendor.'
                          : 'No vendors match your search.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </FadeInOnScroll>
      </AdminMain>
    </AdminLayout>
  )
}

export default AdminVendors
