import AdminNavbar from '../AdminComponents/AdminNavbar'
import AlbuterolImage from '../assets/Albuterol.jpg'
import BrufinImage from '../assets/Brufin.jpg'
import MetforminImage from '../assets/Metformin.webp'
import ParacetamolImage from '../assets/Paracetamol.jpg'
import AmoxicillinImage from '../assets/Amoxicillin.jpg'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
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

const formatPhone = (phone: string): string => {
  const trimmed = phone.trim()
  if (!trimmed || trimmed.toUpperCase() === 'N/A') return '—'
  return trimmed
}

const formatLocation = (location: string | null | undefined): string => {
  const trimmed = location?.trim()
  return trimmed ? trimmed : '—'
}

/** Static placeholder — replace with API data later. */
const STATIC_PURCHASE_HISTORY = [
  {
    id: 1,
    orderId: 'ORD-10241',
    name: 'Paracetamol 500mg',
    image: ParacetamolImage,
    vendor: 'Himalaya Pharmacy',
    paymentMethod: 'eSewa',
    quantity: 2,
    unitPrice: 60,
    purchasedAt: '2026-05-20',
    status: 'Delivered' as const,
  },
  {
    id: 2,
    orderId: 'ORD-10218',
    name: 'Ibuprofen (Brufen)',
    image: BrufinImage,
    vendor: 'City Med Store',
    paymentMethod: 'Khalti',
    quantity: 1,
    unitPrice: 85,
    purchasedAt: '2026-05-12',
    status: 'Shipped' as const,
  },
  {
    id: 3,
    orderId: 'ORD-10195',
    name: 'Metformin 500mg',
    image: MetforminImage,
    vendor: 'HealthPlus Pharmacy',
    paymentMethod: 'Card',
    quantity: 3,
    unitPrice: 120,
    purchasedAt: '2026-05-05',
    status: 'Pending' as const,
  },
  {
    id: 4,
    orderId: 'ORD-10172',
    name: 'Albuterol Inhaler',
    image: AlbuterolImage,
    vendor: 'Nepal MediCare',
    paymentMethod: 'Fonepay',
    quantity: 1,
    unitPrice: 450,
    purchasedAt: '2026-04-28',
    status: 'Shipped' as const,
  },
  {
    id: 5,
    orderId: 'ORD-10140',
    name: 'Amoxicillin 250mg',
    image: AmoxicillinImage,
    vendor: 'GreenLife Pharmacy',
    paymentMethod: 'Cash on Delivery',
    quantity: 2,
    unitPrice: 180,
    purchasedAt: '2026-04-15',
    status: 'Delivered' as const,
  },
]

const purchaseStatusClass: Record<(typeof STATIC_PURCHASE_HISTORY)[number]['status'], string> = {
  Pending: 'bg-amber-100 text-amber-700',
  Shipped: 'bg-sky-100 text-sky-700',
  Delivered: 'bg-emerald-100 text-emerald-700',
}

const AdminUserProfile = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const userId = useMemo(() => {
    const fromQuery = searchParams.get('userId')
    if (fromQuery != null && fromQuery !== '') {
      const parsed = Number(fromQuery)
      if (!Number.isNaN(parsed)) return parsed
    }
    return null
  }, [searchParams])

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
      setUser(null)
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
          setUser(null)
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

  const totalOrders = STATIC_PURCHASE_HISTORY.length
  const totalSpent = STATIC_PURCHASE_HISTORY.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0,
  )

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
            <div className="border-b border-slate-200 px-6 py-6">
              <div className="flex flex-wrap items-center gap-5">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-teal-50">
                  {showProfileImage && profileImageUrl ? (
                    <img
                      alt={`${user.fullName} profile`}
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                      src={profileImageUrl}
                      onError={() => setProfileImageFailed(true)}
                    />
                  ) : (
                    <span className="text-2xl font-bold text-teal-700" aria-hidden>
                      {nameInitial(user.fullName, user.email)}
                    </span>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{user.fullName}</h2>
                  <p className="mt-1.5 text-base text-slate-600">Email: {user.email}</p>
                  <p className="mt-1 text-base text-slate-600">Phone: {formatPhone(user.phoneNumber)}</p>
                  <p className="mt-1 text-base text-slate-600">Location: {formatLocation(user.location)}</p>
                </div>
              </div>
            </div>

            <div className="px-6 py-6">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
                <h3 className="text-base font-semibold text-slate-900">Contact Information</h3>
                <dl className="mt-4 space-y-3 text-base">
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
                    <dd className="text-slate-800">{formatPhone(user.phoneNumber)}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="font-medium text-slate-600">Location</dt>
                    <dd className="text-right text-slate-800">{formatLocation(user.location)}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div className="border-t border-slate-200 px-6 py-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-slate-900">Product Purchase History</h3>
                <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                  <span className="rounded-full bg-teal-50 px-3 py-1 text-teal-700">
                    {totalOrders} orders
                  </span>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                    Total spent: NPR {totalSpent.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full text-left">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-700">No.</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-700">Image</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-700">Order ID</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-700">Product</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-700">Vendor</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-700">Payment</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-700">Date</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-700">Qty</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-700">Price (NPR)</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-700">Total (NPR)</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {STATIC_PURCHASE_HISTORY.map((item, index) => (
                      <tr key={item.id} className="border-t border-slate-200">
                        <td className="px-4 py-3 text-sm text-slate-700">{index + 1}</td>
                        <td className="px-4 py-3">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-10 w-10 rounded-md border border-slate-200 object-cover"
                          />
                        </td>
                        <td className="px-4 py-3 text-sm text-slate-700">{item.orderId}</td>
                        <td className="px-4 py-3 text-sm font-medium text-slate-800">{item.name}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{item.vendor}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{item.paymentMethod}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{item.purchasedAt}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{item.quantity}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">{item.unitPrice.toLocaleString()}</td>
                        <td className="px-4 py-3 text-sm text-slate-700">
                          {(item.quantity * item.unitPrice).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${purchaseStatusClass[item.status]}`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

export default AdminUserProfile
