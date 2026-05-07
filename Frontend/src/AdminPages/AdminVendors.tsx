import AdminNavbar from '../AdminComponents/AdminNavbar'
import { useMemo, useState } from 'react'

const vendors = [
  {
    id: 1,
    shopName: 'Himalaya Pharmacy',
    ownerName: 'Ramesh Koirala',
    location: 'Kathmandu',
    email: 'himalaya.pharmacy@gmail.com',
    phone: '+977-9801112233',
    status: 'Open',
  },
  {
    id: 2,
    shopName: 'Everest Medico',
    ownerName: 'Suman Gurung',
    location: 'Pokhara',
    email: 'everest.medico@gmail.com',
    phone: '+977-9812223344',
    status: 'Close',
  },
  {
    id: 3,
    shopName: 'Valley Health Store',
    ownerName: 'Anita Shrestha',
    location: 'Lalitpur',
    email: 'valley.health@gmail.com',
    phone: '+977-9823334455',
    status: 'Open',
  },
  {
    id: 4,
    shopName: 'CarePlus Pharmacy',
    ownerName: 'Bikash Adhikari',
    location: 'Bhaktapur',
    email: 'careplus.pharmacy@gmail.com',
    phone: '+977-9844445566',
    status: 'Close',
  },
]

const AdminVendors = () => {
  const [searchQuery, setSearchQuery] = useState('')

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
        vendor.status,
      ]
      return searchableValues.some((value) => value.toLowerCase().includes(normalizedQuery))
    })
  }, [searchQuery])

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminNavbar />
      <main className="flex-1 p-8">
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
                    <td className="px-5 py-3 text-sm text-slate-800">{vendor.shopName}</td>
                    <td className="px-5 py-3 text-sm text-slate-700">{vendor.ownerName}</td>
                    <td className="px-5 py-3 text-sm text-slate-700">{vendor.location}</td>
                    <td className="px-5 py-3 text-sm text-slate-700">{vendor.email}</td>
                    <td className="px-5 py-3 text-sm text-slate-700">{vendor.phone}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
                          vendor.status === 'Open' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${
                            vendor.status === 'Open' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        {vendor.status}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <button className="cursor-pointer rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white" type="button">
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredVendors.length === 0 && (
                  <tr className="border-t border-slate-200">
                    <td className="px-5 py-4 text-sm text-slate-500" colSpan={8}>
                      No vendors found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}

export default AdminVendors