import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import Copyright from '../UserComponents/Copyright'
import Footer from '../UserComponents/Footer'
import Header from '../UserComponents/Header'
import { notifyCartChanged } from '../lib/cartStorage'

const PaymentSuccess = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isCod = searchParams.get('method') === 'cod'
  const [phase, setPhase] = useState<'loading' | 'ready'>('loading')

  useEffect(() => {
    notifyCartChanged()
    const timer = window.setTimeout(() => setPhase('ready'), 2500)
    return () => window.clearTimeout(timer)
  }, [])

  const loadingTitle = isCod ? 'Placing your order' : 'Confirming your payment'
  const readyTitle = isCod ? 'Order placed successfully' : 'Payment successful'
  const loadingMessage = isCod
    ? 'Please wait while we confirm your cash on delivery order.'
    : 'Please wait while we verify your payment and place your order.'
  const readyMessage = isCod
    ? 'Your cash on delivery order has been placed. You can track its status anytime from your orders page.'
    : 'Your order has been placed. You can track its status anytime from your orders page.'

  return (
    <div className="bg-white">
      <Header />
      <main className="flex min-h-[60vh] items-center justify-center px-4 py-16 md:px-8 lg:px-[80px]">
        <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-10">
          <div
            className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full ${
              phase === 'loading' ? 'bg-teal-50' : 'bg-emerald-100'
            }`}
          >
            {phase === 'loading' ? (
              <div className="h-10 w-10 animate-spin rounded-full border-4 border-teal-100 border-t-teal-600" />
            ) : (
              <svg
                aria-hidden
                className="h-10 w-10 text-emerald-600"
                fill="none"
                stroke="currentColor"
                strokeWidth={2.5}
                viewBox="0 0 24 24"
              >
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>

          <h1 className="mt-6 text-xl font-bold text-slate-900">
            {phase === 'loading' ? loadingTitle : readyTitle}
          </h1>
          <p className="mt-2 min-h-[44px] text-sm leading-relaxed text-slate-600">
            {phase === 'loading' ? loadingMessage : readyMessage}
          </p>

          <button
            className={`mt-8 w-full rounded-lg bg-linear-to-br from-teal-600 to-teal-700 py-3 text-sm font-semibold text-white shadow-sm shadow-teal-900/20 transition hover:from-teal-700 hover:to-teal-800 ${
              phase === 'loading' ? 'pointer-events-none opacity-0' : 'cursor-pointer opacity-100'
            }`}
            onClick={() => navigate('/ordertracking', { replace: true })}
            tabIndex={phase === 'loading' ? -1 : 0}
            type="button"
          >
            Track your order
          </button>
        </section>
      </main>
      <Footer />
      <Copyright />
    </div>
  )
}

export default PaymentSuccess
