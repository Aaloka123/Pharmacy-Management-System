import { useEffect, useMemo, useState } from 'react'
import { LuBanknote } from 'react-icons/lu'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import esewaLogo from '../assets/E-sewa.png'
import khaltiLogo from '../assets/Khalti.png'
import Copyright from '../UserComponents/Copyright'
import Footer from '../UserComponents/Footer'
import Header from '../UserComponents/Header'
import { fetchCart } from '../lib/cartApi'
import { isCartUserLoggedIn, type CartLine } from '../lib/cartStorage'

type PaymentMethod = 'cod' | 'esewa' | 'khalti'

type CheckoutLocationState = {
  lines?: CartLine[]
}

const PAYMENT_OPTIONS: Array<{
  id: PaymentMethod
  label: string
  description: string
}> = [
  {
    id: 'cod',
    label: 'Cash on Delivery',
    description: 'Pay with cash when your order is delivered.',
  },
  {
    id: 'esewa',
    label: 'eSewa',
    description: 'Pay securely using your eSewa wallet.',
  },
  {
    id: 'khalti',
    label: 'Khalti',
    description: 'Pay securely using your Khalti wallet.',
  },
]

const renderPaymentIcon = (id: PaymentMethod) => {
  const iconSlot = 'flex h-8 w-20 shrink-0 items-center justify-center'

  if (id === 'cod') {
    return (
      <span className={iconSlot}>
        <LuBanknote className="h-8 w-8 text-teal-700" strokeWidth={1.8} />
      </span>
    )
  }

  if (id === 'esewa') {
    return (
      <span className={iconSlot}>
        <img alt="eSewa" className="h-8 w-auto max-w-full object-contain" src={esewaLogo} />
      </span>
    )
  }

  return (
    <span className={iconSlot}>
      <img alt="Khalti" className="h-8 w-auto max-w-full object-contain" src={khaltiLogo} />
    </span>
  )
}

const Checkout = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const [lines, setLines] = useState<CartLine[]>([])
  const [loading, setLoading] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cod')
  const [placingOrder, setPlacingOrder] = useState(false)

  useEffect(() => {
    const loadCheckoutItems = async () => {
      if (!isCartUserLoggedIn()) {
        setLines([])
        setLoading(false)
        return
      }

      const state = location.state as CheckoutLocationState | null
      if (state?.lines && state.lines.length > 0) {
        setLines(state.lines)
        setLoading(false)
        return
      }

      try {
        const cartLines = await fetchCart()
        setLines(cartLines)
      } catch {
        setLines([])
      } finally {
        setLoading(false)
      }
    }

    void loadCheckoutItems()
  }, [location.state])

  const subtotal = useMemo(() => lines.reduce((sum, line) => sum + line.unitPrice * line.qty, 0), [lines])
  const tax = useMemo(() => subtotal * 0.13, [subtotal])
  const total = useMemo(() => subtotal + tax, [subtotal, tax])
  const itemCount = useMemo(() => lines.reduce((sum, line) => sum + line.qty, 0), [lines])
  const loggedIn = isCartUserLoggedIn()

  const handlePlaceOrder = async () => {
    if (lines.length === 0) {
      toast.warn('Your cart is empty.')
      return
    }

    setPlacingOrder(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 600))
      const paymentLabel = PAYMENT_OPTIONS.find((option) => option.id === paymentMethod)?.label ?? 'Selected method'
      toast.success(`Order placed with ${paymentLabel}. We will confirm your order shortly.`)
      navigate('/products', { replace: true })
    } finally {
      setPlacingOrder(false)
    }
  }

  return (
    <div className="bg-white">
      <Header />
      <main className="px-4 pb-12 pt-6 md:px-8 lg:px-[80px]">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Checkout</h1>
            <p className="mt-2 text-sm text-slate-600">Choose a payment method and review your order before placing it.</p>
          </div>
          <Link className="text-sm font-semibold text-teal-700 hover:text-teal-800 hover:underline" to="/cart">
            Back to cart
          </Link>
        </div>

        {loading ? (
          <p className="mt-10 text-center text-sm text-slate-600">Loading checkout...</p>
        ) : !loggedIn ? (
          <section className="mt-10 rounded-3xl border border-dashed border-slate-200 bg-white px-8 py-16 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">Sign in to checkout</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
              Log in to review your cart and complete your purchase.
            </p>
            <button
              className="mt-8 inline-flex items-center justify-center rounded-lg bg-linear-to-br from-teal-600 to-teal-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-teal-900/20 transition hover:from-teal-700 hover:to-teal-800"
              onClick={() => navigate('/login', { state: { from: '/checkout' } })}
              type="button"
            >
              Log in
            </button>
          </section>
        ) : lines.length === 0 ? (
          <section className="mt-10 rounded-3xl border border-dashed border-slate-200 bg-white px-8 py-16 text-center shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">No items to checkout</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">
              Add products to your cart and select items before proceeding to checkout.
            </p>
            <Link
              className="mt-8 inline-flex items-center justify-center rounded-lg bg-linear-to-br from-teal-600 to-teal-700 px-6 py-2.5 text-sm font-semibold text-white shadow-sm shadow-teal-900/20 transition hover:from-teal-700 hover:to-teal-800"
              to="/products"
            >
              Browse products
            </Link>
          </section>
        ) : (
          <div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 items-start gap-6 lg:grid-cols-2 lg:gap-8">
            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-900">Payment method</h2>
                <p className="mt-1 text-sm text-slate-600">Select how you would like to pay for this order.</p>
              </div>

              <div className="mt-5 space-y-3">
                {PAYMENT_OPTIONS.map((option) => {
                  const selected = paymentMethod === option.id
                  return (
                    <label
                      className={`flex cursor-pointer items-center gap-3.5 rounded-xl border px-4 py-3.5 transition ${
                        selected
                          ? 'border-teal-600 bg-teal-50/50 shadow-sm ring-1 ring-teal-600/15'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                      key={option.id}
                    >
                      <input
                        checked={selected}
                        className="h-4 w-4 shrink-0 border-slate-300 text-teal-700 focus:ring-teal-700"
                        name="payment-method"
                        onChange={() => setPaymentMethod(option.id)}
                        type="radio"
                        value={option.id}
                      />
                      {renderPaymentIcon(option.id)}
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-semibold text-slate-900">{option.label}</span>
                        <span className="mt-0.5 block text-sm leading-snug text-slate-600">{option.description}</span>
                      </span>
                    </label>
                  )
                })}
              </div>

              {paymentMethod === 'cod' ? (
                <p className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-600">
                  You will pay the total amount in cash when your medicines are delivered.
                </p>
              ) : (
                <p className="mt-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm leading-relaxed text-slate-600">
                  You will be redirected to complete payment with{' '}
                  {paymentMethod === 'esewa' ? 'eSewa' : 'Khalti'} after placing the order.
                </p>
              )}
            </section>

            <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:sticky lg:top-24">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-lg font-bold text-slate-900">Purchase details</h2>
              </div>

              <div className="mt-5 max-h-64 space-y-3 overflow-y-auto pr-1">
                {lines.map((line) => (
                  <div className="flex gap-3 border-b border-slate-100 pb-3 last:border-b-0 last:pb-0" key={line.id}>
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-100 bg-white">
                      {line.image ? (
                        <img alt={line.name} className="h-full w-full object-contain p-1" src={line.image} />
                      ) : (
                        <span className="text-[10px] text-slate-400">No image</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{line.name}</p>
                      <p className="text-xs text-slate-500">Qty: {line.qty}</p>
                      <p className="mt-1 text-sm font-semibold text-teal-700">
                        NRP {(line.unitPrice * line.qty).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <dl className="mt-5 space-y-3 border-t border-slate-100 pt-4 text-sm">
                <div className="flex justify-between text-slate-600">
                  <dt>Items</dt>
                  <dd className="font-medium text-slate-900">{itemCount}</dd>
                </div>
                <div className="flex justify-between text-slate-600">
                  <dt>Subtotal</dt>
                  <dd className="font-medium text-slate-900">NRP {subtotal.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between text-slate-600">
                  <dt>Tax (13%)</dt>
                  <dd className="font-medium text-slate-900">NRP {tax.toLocaleString()}</dd>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-3 text-slate-800">
                  <dt className="font-semibold">Total</dt>
                  <dd className="text-base font-bold text-teal-700">NRP {total.toLocaleString()}</dd>
                </div>
              </dl>

              <button
                className="mt-6 w-full rounded-lg bg-linear-to-br from-teal-600 to-teal-700 py-3 text-sm font-semibold text-white shadow-sm shadow-teal-900/20 transition enabled:hover:from-teal-700 enabled:hover:to-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={placingOrder}
                onClick={() => void handlePlaceOrder()}
                type="button"
              >
                {placingOrder ? 'Placing order…' : 'Place order'}
              </button>
            </aside>
          </div>
        )}
      </main>
      <Footer />
      <Copyright />
    </div>
  )
}

export default Checkout
