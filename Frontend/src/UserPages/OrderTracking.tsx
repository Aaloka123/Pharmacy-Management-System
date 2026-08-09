import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import Copyright from '../UserComponents/Copyright'
import Footer from '../UserComponents/Footer'
import Header from '../UserComponents/Header'
import { ApiRequestError, resolveBackendUrl } from '../lib/api'
import {
  cancelOrder,
  canUserCancelOrder,
  fetchMyOrders,
  type ApiOrderStatus,
  type ApiPaymentMethod,
  type VendorOrderDto,
} from '../lib/orderApi'

const statusLabel: Record<ApiOrderStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELED: 'Canceled',
}

const statusClass: Record<ApiOrderStatus, string> = {
  PENDING: 'bg-amber-100 text-amber-800',
  CONFIRMED: 'bg-indigo-100 text-indigo-800',
  SHIPPED: 'bg-sky-100 text-sky-800',
  DELIVERED: 'bg-emerald-100 text-emerald-800',
  CANCELED: 'bg-rose-100 text-rose-800',
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

const OrderTracking = () => {
  const [orders, setOrders] = useState<VendorOrderDto[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelingId, setCancelingId] = useState<number | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchMyOrders()
        setOrders(data)
      } catch {
        setOrders([])
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const handleCancel = async (orderId: number) => {
    setCancelingId(orderId)
    try {
      const updated = await cancelOrder(orderId)
      setOrders((prev) => prev.map((order) => (order.id === orderId ? updated : order)))
      toast.success('Order canceled successfully.')
    } catch (err) {
      if (err instanceof ApiRequestError && err.response.status === 400) {
        toast.error('This order can no longer be canceled.')
      } else {
        toast.error('Could not cancel the order. Please try again.')
      }
    } finally {
      setCancelingId(null)
    }
  }

  return (
    <div className="bg-white">
      <Header />
      <main className="px-4 pb-12 pt-6 md:px-8 lg:px-[80px]">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Order tracking</h1>
            <p className="mt-2 text-sm text-slate-600">Track the status of your MedNexus orders.</p>
          </div>
          <Link className="text-sm font-semibold text-teal-700 hover:text-teal-800 hover:underline" to="/cart">
            Back to cart
          </Link>
        </div>

        {loading ? (
          <p className="mt-10 text-center text-sm text-slate-600">Loading your orders...</p>
        ) : orders.length === 0 ? (
          <section className="mx-auto mt-10 max-w-2xl rounded-2xl border border-dashed border-slate-200 bg-white px-8 py-16 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">No orders to track yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
              Once you place an order, it will appear here so you can follow delivery updates.
            </p>
            <Link
              className="mt-8 inline-flex items-center justify-center rounded-lg bg-linear-to-br from-teal-600 to-teal-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-teal-900/20 transition hover:from-teal-700 hover:to-teal-800"
              to="/products"
            >
              Browse products
            </Link>
          </section>
        ) : (
          <section className="mx-auto mt-10 max-w-3xl space-y-4">
            {orders.map((order) => (
              <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" key={order.id}>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-white">
                      {order.productImage ? (
                        <img
                          alt={order.productName}
                          className="h-full w-full object-contain p-1"
                          src={resolveBackendUrl(order.productImage)}
                        />
                      ) : (
                        <span className="text-[10px] text-slate-400">No image</span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{order.productName}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        Qty {order.quantity} · NRP {(Number(order.unitPrice) * order.quantity).toLocaleString()}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <p className="text-xs text-slate-500">Ordered {order.orderDate.slice(0, 10)}</p>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${paymentBadgeClass[order.paymentMethod]}`}
                        >
                          {paymentBadgeLabel[order.paymentMethod]}
                        </span>
                      </div>
                      <Link
                        className="mt-2 inline-flex text-xs font-semibold text-teal-700 hover:text-teal-800 hover:underline"
                        to={`/productsdetail?id=${order.productId}`}
                      >
                        View product details
                      </Link>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    {canUserCancelOrder(order.status) ? (
                      <button
                        className="cursor-pointer rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:opacity-60"
                        disabled={cancelingId === order.id}
                        onClick={() => void handleCancel(order.id)}
                        type="button"
                      >
                        {cancelingId === order.id ? 'Canceling…' : 'Cancel order'}
                      </button>
                    ) : null}
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[order.status]}`}>
                      {statusLabel[order.status]}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
      <Footer />
      <Copyright />
    </div>
  )
}

export default OrderTracking
