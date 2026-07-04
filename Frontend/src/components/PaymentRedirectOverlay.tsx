import { LuBanknote } from 'react-icons/lu'
import { createPortal } from 'react-dom'
import esewaLogo from '../assets/E-sewa.png'
import khaltiLogo from '../assets/Khalti.png'

type PaymentRedirectOverlayProps = {
  provider: 'cod' | 'esewa' | 'khalti'
}

const PaymentRedirectOverlay = ({ provider }: PaymentRedirectOverlayProps) => {
  const isEsewa = provider === 'esewa'
  const isKhalti = provider === 'khalti'
  const isCod = provider === 'cod'
  const label = isEsewa ? 'eSewa' : isKhalti ? 'Khalti' : 'Cash on Delivery'
  const ringClass = isKhalti ? 'bg-[#5C2D91]/20' : 'bg-teal-400/20'
  const pulseClass = isKhalti ? 'bg-[#5C2D91]/10' : 'bg-teal-50'
  const dotClass = isKhalti ? 'bg-[#5C2D91]' : 'bg-teal-600'
  const title = isCod ? 'Placing your order' : `Redirecting to ${label}`
  const description = isCod
    ? 'Please wait while we confirm your cash on delivery order.'
    : 'Please wait while we securely connect you to complete your payment.'

  return createPortal(
    <div
      aria-busy="true"
      aria-live="polite"
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 px-4 backdrop-blur-[2px]"
    >
      <section className="w-full max-w-sm animate-[paymentOverlayIn_0.35s_ease-out] rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-2xl sm:p-10">
        <div className="relative mx-auto flex h-24 w-24 items-center justify-center">
          <span className={`absolute inset-0 animate-ping rounded-full ${ringClass}`} />
          <span className={`absolute inset-2 animate-pulse rounded-full ${pulseClass}`} />
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
            {isCod ? (
              <LuBanknote className="h-10 w-10 text-teal-700" strokeWidth={1.8} />
            ) : (
              <img
                alt={label}
                className="h-10 w-auto max-w-[4.5rem] object-contain"
                src={isEsewa ? esewaLogo : khaltiLogo}
              />
            )}
          </div>
        </div>

        <div className="mx-auto mt-6 flex items-center justify-center gap-1.5">
          <span className={`h-2 w-2 animate-bounce rounded-full ${dotClass} [animation-delay:0ms]`} />
          <span className={`h-2 w-2 animate-bounce rounded-full ${dotClass} [animation-delay:150ms]`} />
          <span className={`h-2 w-2 animate-bounce rounded-full ${dotClass} [animation-delay:300ms]`} />
        </div>

        <h2 className="mt-5 text-xl font-bold text-slate-900">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
        <p className="mt-4 text-xs text-slate-400">Do not close this window.</p>
      </section>

      <style>{`
        @keyframes paymentOverlayIn {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>,
    document.body,
  )
}

export default PaymentRedirectOverlay
