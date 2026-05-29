import AdminNavbar from '../AdminComponents/AdminNavbar'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { api, resolveProfileImageUrl } from '../lib/api'

type UserDetail = {
  id: number
  fullName: string
  email: string
  phoneNumber: string
  location: string | null
  profileImage: string | null
  role: 'ADMIN' | 'VENDOR' | 'USER'
}

const nameInitial = (fullName: string, email: string): string => {
  const fromName = fullName.trim().charAt(0)
  if (fromName) return fromName.toUpperCase()
  const fromEmail = email.trim().charAt(0)
  return fromEmail ? fromEmail.toUpperCase() : '?'
}

const AdminUserProfile = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const userId = (location.state as { userId?: number } | null)?.userId

  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profileImageFailed, setProfileImageFailed] = useState(false)

  useEffect(() => {
    setProfileImageFailed(false)
  }, [user?.profileImage, user?.id])

  useEffect(() => {
    if (userId == null) {
      setLoading(false)
      setError('No user selected. Open a user from the users list.')
      return
    }

    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data } = await api.get<UserDetail>(`/api/users/${userId}`)
        if (!cancelled) {
          setUser(data)
        }
      } catch (err) {
        if (!cancelled) {
          setError('Could not load user profile.')
          toast.error('Failed to load user details.')
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
  }, [userId])

  const profileImageUrl = user ? resolveProfileImageUrl(user.profileImage) : null
  const showProfileImage = Boolean(profileImageUrl) && !profileImageFailed

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminNavbar />
      <main className="flex-1 p-6">
        <Link
          to="/adminusers"
          className="inline-flex items-center gap-2 text-sm font-semibold text-teal-700 transition hover:text-teal-800"
        >
          <span aria-hidden>←</span>
          Back to Users
        </Link>

        {loading ? (
          <p className="mt-8 text-center text-sm text-slate-600">Loading user profile…</p>
        ) : error || !user ? (
          <div className="mt-8 rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-slate-600">{error ?? 'User not found.'}</p>
            <button
              type="button"
              className="mt-4 text-sm font-semibold text-teal-700 hover:text-teal-800"
              onClick={() => navigate('/adminusers')}
            >
              Go to users list
            </button>
          </div>
        ) : (
          <section className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-teal-50">
                  {showProfileImage && profileImageUrl ? (
                    <img
                      alt={`${user.fullName} profile`}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                      src={profileImageUrl}
                      onError={() => setProfileImageFailed(true)}
                    />
                  ) : (
                    <span className="text-xl font-bold text-teal-700" aria-hidden>
                      {nameInitial(user.fullName, user.email)}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-900">{user.fullName}</h2>
                  <p className="mt-1 text-sm text-slate-600">Email: {user.email}</p>
                  <p className="mt-1 text-sm text-slate-600">Phone: {user.phoneNumber}</p>
                  <span className="mt-2 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {user.role}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 px-5 py-5 md:grid-cols-2">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900">Contact Information</h3>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="font-medium text-slate-600">Full Name</dt>
                    <dd className="text-slate-800">{user.fullName}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="font-medium text-slate-600">Email</dt>
                    <dd className="text-slate-800">{user.email}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="font-medium text-slate-600">Phone</dt>
                    <dd className="text-slate-800">{user.phoneNumber}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="font-medium text-slate-600">Location</dt>
                    <dd className="text-right text-slate-800">{user.location?.trim() || '—'}</dd>
                  </div>
                </dl>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="text-sm font-semibold text-slate-900">Account</h3>
                <dl className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="font-medium text-slate-600">User ID</dt>
                    <dd className="text-slate-800">{user.id}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="font-medium text-slate-600">Role</dt>
                    <dd className="text-slate-800">{user.role}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default AdminUserProfile
