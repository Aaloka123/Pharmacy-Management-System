import { Link } from 'react-router-dom'
import { HiOutlineArrowRight } from 'react-icons/hi2'

const CTA = () => {
  return (
    <section
      className="px-6 py-12 md:px-8 md:py-16"
      style={{
        background: 'linear-gradient(180deg, #7FCBC3 0%, #4DB6AB 48%, #2f7570 100%)',
      }}
    >
      <div className="mx-auto max-w-[920px] text-center">
        <h2 className="mx-auto max-w-[420px] text-[1.85rem] font-bold leading-tight tracking-tight text-white md:text-[2.1rem]">
          Ready to get started?
        </h2>
        <p className="mx-auto mt-4 max-w-[400px] text-sm leading-6 text-white/90">
          Browse trusted medicines, compare options, and order from verified pharmacies in just a few
          clicks.
        </p>
        <Link
          className="mt-6 inline-flex cursor-pointer items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-teal-800 transition hover:bg-white/90"
          to="/products"
        >
          Shop Now
          <HiOutlineArrowRight aria-hidden className="h-4 w-4" strokeWidth={2.2} />
        </Link>
      </div>
    </section>
  )
}

export default CTA
