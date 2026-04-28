import { Link } from 'react-router-dom'
import CtaImage from '../assets/cta.png'

const CTA = () => {
  return (
    <section className="relative overflow-hidden px-6 py-14 text-white md:px-12">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${CtaImage})` }}
      />
      <div aria-hidden="true" className="absolute inset-0 bg-slate-900/55" />
      <div className="relative z-10 mx-auto max-w-[1200px]">
        <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/80">Need help fast?</p>
            <h2 className="mt-3 text-2xl font-bold leading-tight md:text-3xl">Get trusted medicines delivered to your doorstep.</h2>
            <p className="mt-4 text-base text-white/90 md:text-lg">
              Browse products, compare options, and place your order in minutes with our easy and secure pharmacy platform.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-teal-700 transition hover:bg-slate-100"
              to="/products"
            >
              Shop Now
            </Link>
            <Link
              className="rounded-xl border border-white/70 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              to="/contacts"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CTA