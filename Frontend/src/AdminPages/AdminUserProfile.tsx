import AdminNavbar from '../AdminComponents/AdminNavbar'
import { AdminMain, FadeInOnScroll } from '../components/PortalMain'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { api, resolveBackendUrl, resolveProfileImageUrl } from '../lib/api'
import {
  fetchUserOrders,
  type ApiOrderStatus,
  type ApiPaymentMethod,
  type VendorOrderDto,
} from '../lib/orderApi'

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

const paymentLabel: Record<ApiPaymentMethod, string> = {
  COD: 'Cash on Delivery',
  ESEWA: 'eSewa',
  KHALTI: 'Khalti',
}

const paymentBadgeLabel: Record<ApiPaymentMethod, string> = {
  COD: 'COD',
  ESEWA: 'e-sewa',
  KHALTI: 'khalti',
}

const paymentBadgeClass: Record<ApiPaymentMethod, string> = {
  COD: 'bg-slate-200 text-slate-800',
  ESEWA: 'bg-emerald-100 text-emerald-800',
  KHALTI: 'bg-violet-100 text-violet-800',
}

type PaymentFilter = 'ALL' | ApiPaymentMethod

const statusLabel: Record<ApiOrderStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELED: 'Canceled',
}

const purchaseStatusClass: Record<ApiOrderStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  CONFIRMED: 'bg-indigo-100 text-indigo-700',
  SHIPPED: 'bg-sky-100 text-sky-700',
  DELIVERED: 'bg-emerald-100 text-emerald-700',
  CANCELED: 'bg-rose-100 text-rose-700',
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
  const [orders, setOrders] = useState<VendorOrderDto[]>([])
  const [loading, setLoading] = useState(true)
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profileImageFailed, setProfileImageFailed] = useState(false)
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('ALL')

  useEffect(() => {
    setProfileImageFailed(false)
  }, [user?.profileImage, user?.id])

  useEffect(() => {
    if (userId == null) {
      setLoading(false)
      setOrdersLoading(false)
      setError('No user selected. Open a user from the users list.')
      setUser(null)
      setOrders([])
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

  useEffect(() => {
    if (userId == null) return

    let cancelled = false
    const loadOrders = async () => {
      setOrdersLoading(true)
      try {
        const data = await fetchUserOrders(userId)
        if (!cancelled) {
          setOrders(data)
        }
      } catch (err) {
        if (!cancelled) {
          setOrders([])
          toast.error('Failed to load purchase history.')
          console.error(err)
        }
      } finally {
        if (!cancelled) setOrdersLoading(false)
      }
    }
    void loadOrders()
    return () => {
      cancelled = true
    }
  }, [userId])

  const profileImageUrl = user ? resolveProfileImageUrl(user.profileImage) : null
  const showProfileImage = Boolean(profileImageUrl) && !profileImageFailed

  const filteredOrders = useMemo(() => {
    if (paymentFilter === 'ALL') return orders
    return orders.filter((item) => item.paymentMethod === paymentFilter)
  }, [orders, paymentFilter])

  const totalSpent = orders.reduce((sum, item) => {
    if (item.status === 'CANCELED') return sum
    return sum + item.quantity * Number(item.unitPrice)
  }, 0)

  return (
    <div className="flex min-h-screen bg-slate-50">
      <AdminNavbar />
      <AdminMain>
      <FadeInOnScroll>
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
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-teal-600"
                    value={paymentFilter}
                    onChange={(event) => setPaymentFilter(event.target.value as PaymentFilter)}
                  >
                    <option value="ALL">All payments</option>
                    <option value="KHALTI">{paymentLabel.KHALTI}</option>
                    <option value="ESEWA">{paymentLabel.ESEWA}</option>
                    <option value="COD">{paymentLabel.COD}</option>
                  </select>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-teal-50 px-3 py-1 text-teal-700">
                      {filteredOrders.length} orders
                    </span>
                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                      Total spent: NPR {totalSpent.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {ordersLoading ? (
                <p className="mt-4 text-sm text-slate-600">Loading purchase history…</p>
              ) : orders.length === 0 ? (
                <p className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
                  No purchases yet.
                </p>
              ) : filteredOrders.length === 0 ? (
                <p className="mt-4 rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
                  No purchases found for this payment method.
                </p>
              ) : (
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
                      {filteredOrders.map((item, index) => {
                        const unitPrice = Number(item.unitPrice)
                        const lineTotal = item.quantity * unitPrice
                        const imageUrl = item.productImage ? resolveBackendUrl(item.productImage) : null

                        return (
                          <tr key={item.id} className="border-t border-slate-200">
                            <td className="px-4 py-3 text-sm text-slate-700">{index + 1}</td>
                            <td className="px-4 py-3">
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={item.productName}
                                  className="h-10 w-10 rounded-md border border-slate-200 object-cover"
                                />
                              ) : (
                                <span className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-200 bg-slate-50 text-[10px] text-slate-400">
                                  N/A
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-700">ORD-{item.id}</td>
                            <td className="px-4 py-3 text-sm font-medium text-slate-800">{item.productName}</td>
                            <td className="px-4 py-3 text-sm text-slate-700">{item.vendorName}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${paymentBadgeClass[item.paymentMethod]}`}
                              >
                                {paymentBadgeLabel[item.paymentMethod]}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-700">{item.orderDate.slice(0, 10)}</td>
                            <td className="px-4 py-3 text-sm text-slate-700">{item.quantity}</td>
                            <td className="px-4 py-3 text-sm text-slate-700">{unitPrice.toLocaleString()}</td>
                            <td className="px-4 py-3 text-sm text-slate-700">{lineTotal.toLocaleString()}</td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${purchaseStatusClass[item.status]}`}
                              >
                                {statusLabel[item.status]}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </section>
        )}
      </FadeInOnScroll>
      </AdminMain>
    </div>
  )
}

export default AdminUserProfile
