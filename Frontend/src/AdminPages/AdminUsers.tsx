import AdminNavbar from '../AdminComponents/AdminNavbar'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { api } from '../lib/api'

type UserRow = {
  id: number
  fullName: string
  email: string
  phoneNumber: string
  location: string | null
  role: 'ADMIN' | 'VENDOR' | 'USER'
}

const AdminUsers = () => {
  const navigate = useNavigate()
  const [users, setUsers] = useState<UserRow[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data } = await api.get<UserRow[]>('/api/users?role=USER')
        if (!cancelled) setUsers(data)
      } catch (err) {
        if (!cancelled) {
          setError('Could not load users. Is the backend running?')
          toast.error('Failed to load users.')
          console.error(err)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const filteredUsers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase()
    if (!normalizedQuery) return users
    return users.filter((user) => {
      const haystack = [user.fullName, user.email, user.location ?? '', user.phoneNumber]
      return haystack.some((value) => value.toLowerCase().includes(normalizedQuery))
    })
  }, [users, searchQuery])

  const openProfile = (id: number) => {
    navigate('/adminuserprofile', { state: { userId: id } })
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminNavbar />
      <main className="flex-1 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Users</h1>
            <p className="mt-1 text-sm text-slate-600">
              View registered users and contact details.
              {!loading && !error ? (
                <span className="ml-2 text-slate-500">({users.length} total)</span>
              ) : null}
            </p>
          </div>
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
                {loading ? (
                  <tr className="border-t border-slate-200">
                    <td className="px-5 py-4 text-sm text-slate-500" colSpan={6}>
                      Loading users…
                    </td>
                  </tr>
                ) : error ? (
                  <tr className="border-t border-slate-200">
                    <td className="px-5 py-4 text-sm text-rose-600" colSpan={6}>
                      {error}
                    </td>
                  </tr>
                ) : filteredUsers.length === 0 ? (
                  <tr className="border-t border-slate-200">
                    <td className="px-5 py-4 text-sm text-slate-500" colSpan={6}>
                      No users found.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, index) => (
                    <tr className="border-t border-slate-200" key={user.id}>
                      <td className="px-5 py-3 text-sm text-slate-700">{index + 1}</td>
                      <td className="px-5 py-3 text-sm text-slate-800">
                        <button
                          type="button"
                          onClick={() => openProfile(user.id)}
                          className="cursor-pointer font-medium text-slate-800 decoration-slate-500 underline-offset-2 hover:underline"
                        >
                          {user.fullName}
                        </button>
                      </td>
                      <td className="px-5 py-3 text-sm text-slate-700">{user.email}</td>
                      <td className="px-5 py-3 text-sm text-slate-700">{user.location?.trim() || '—'}</td>
                      <td className="px-5 py-3 text-sm text-slate-700">{user.phoneNumber}</td>
                      <td className="px-5 py-3">
                        <button
                          className="cursor-pointer rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-teal-700"
                          type="button"
                          onClick={() => openProfile(user.id)}
                        >
                          View Profile
                        </button>
                      </td>
                    </tr>
                  ))
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
