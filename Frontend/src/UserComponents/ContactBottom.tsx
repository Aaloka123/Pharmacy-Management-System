import { Link } from 'react-router-dom'
import { HiOutlineArrowRight } from 'react-icons/hi2'
import { LuClock3, LuPackageSearch, LuStore } from 'react-icons/lu'
import type { IconType } from 'react-icons'

const supportTopics: { icon: IconType; title: string; description: string }[] = [
  {
    icon: LuPackageSearch,
    title: 'Order support',
    description: 'Track orders, delivery updates, and help with cancellations or refunds.',
  },
  {
    icon: LuClock3,
    title: 'Quick response',
    description: 'Our team usually replies within 24 hours on business days.',
  },
  {
    icon: LuStore,
    title: 'Vendor partnerships',
    description: 'Interested in joining MedNexus? We will guide you through onboarding.',
  },
]

const ContactBottom = () => {
  return (
    <>
      <section className="border-t border-slate-200 bg-white px-4 py-12 md:px-8 md:py-14 lg:px-[80px]">
        <div className="mx-auto max-w-[1280px]">
          <div className="text-center md:text-left">
            <h2 className="text-xl font-bold tracking-tight text-slate-900 md:text-2xl">How we can help</h2>
            <p className="mx-auto mt-2 max-w-xl text-[15px] leading-7 text-slate-600 md:mx-0">
              Whether you need help with an order, a product question, or becoming a vendor, our team is ready
              to assist.
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
            {supportTopics.map(({ icon: Icon, title, description }) => (
              <div
                className="rounded-2xl border border-slate-200 bg-[#F8FAFC] p-5 transition hover:border-teal-200 hover:bg-teal-50/30 md:p-6"
                key={title}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-100 text-teal-700">
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </div>
                <h3 className="mt-4 text-[16px] font-semibold text-slate-900">{title}</h3>
                <p className="mt-2 text-[14px] leading-6 text-slate-600">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        className="px-4 py-12 md:px-8 md:py-14 lg:px-[80px]"
        style={{
          background: 'linear-gradient(180deg, #7FCBC3 0%, #4DB6AB 48%, #2f7570 100%)',
        }}
      >
        <div className="mx-auto flex max-w-[1280px] flex-col items-center gap-5 text-center md:flex-row md:justify-between md:text-left">
          <div>
            <h2 className="text-[1.5rem] font-bold tracking-tight text-white md:text-[1.75rem]">
              Explore while you wait
            </h2>
            <p className="mt-2 max-w-md text-sm leading-6 text-white/90 md:text-[15px]">
              Browse trusted medicines from verified partner pharmacies across Nepal.
            </p>
          </div>
          <Link
            className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-teal-800 transition hover:bg-white/90 md:px-7 md:py-3"
            to="/products"
          >
            View Products
            <HiOutlineArrowRight aria-hidden className="h-4 w-4" strokeWidth={2.2} />
          </Link>
        </div>
      </section>
    </>
  )
}

export default ContactBottom
