import AdminNavbar from '../AdminComponents/AdminNavbar'
import { useMemo, useState } from 'react'

const users = [
  { id: 1, name: 'Aarav Sharma', email: 'aarav.sharma@gmail.com', location: 'Kathmandu', number: '+977-9812345678' },
  { id: 2, name: 'Sita Karki', email: 'sita.karki@gmail.com', location: 'Pokhara', number: '+977-9823456789' },
  { id: 3, name: 'Rohan Thapa', email: 'rohan.thapa@gmail.com', location: 'Lalitpur', number: '+977-9845671234' },
  { id: 4, name: 'Nisha Adhikari', email: 'nisha.adhikari@gmail.com', location: 'Bhaktapur', number: '+977-9865432109' },
]

const AdminUsers = () => {
  const [searchQuery, setSearchQuery] = useState('')

  const filteredUsers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()

    if (!normalizedQuery) {
      return users
    }

    return users.filter((user) => {
      const searchableValues = [user.name, user.email, user.location, user.number]
      return searchableValues.some((value) => value.toLowerCase().includes(normalizedQuery))
    })
  }, [searchQuery])

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminNavbar />
      <main className="flex-1 p-8">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-slate-900">Admin Users</h1>
          <input
            className="w-64 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-teal-600"
            placeholder="Search users..."
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
                  <th className="px-5 py-3 text-sm font-semibold text-slate-700">Name</th>
                  <th className="px-5 py-3 text-sm font-semibold text-slate-700">Email</th>
                  <th className="px-5 py-3 text-sm font-semibold text-slate-700">Location</th>
                  <th className="px-5 py-3 text-sm font-semibold text-slate-700">Number</th>
                  <th className="px-5 py-3 text-sm font-semibold text-slate-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user, index) => (
                  <tr className="border-t border-slate-200" key={user.id}>
                    <td className="px-5 py-3 text-sm text-slate-700">{index + 1}</td>
                    <td className="px-5 py-3 text-sm text-slate-800">{user.name}</td>
                    <td className="px-5 py-3 text-sm text-slate-700">{user.email}</td>
                    <td className="px-5 py-3 text-sm text-slate-700">{user.location}</td>
                    <td className="px-5 py-3 text-sm text-slate-700">{user.number}</td>
                    <td className="px-5 py-3">
                      <button
                        className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white"
                        type="button"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr className="border-t border-slate-200">
                    <td className="px-5 py-4 text-sm text-slate-500" colSpan={6}>
                      No users found.
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

export default AdminUsers