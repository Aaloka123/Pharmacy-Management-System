import { Link } from 'react-router-dom'
import heroImage from '../assets/herobackground.png'

const stats = [
  { value: '24/7', label: 'Emergency Service' },
  { value: '50+', label: 'Pharmacy' },
  { value: '100k+', label: 'Happy Patient' },
]

const Hero = () => {
  return (
    <section className="relative w-full overflow-x-clip overflow-y-visible">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #ffffff 0%, #eef8f6 16%, #b8e4dc 32%, #6ebfb4 52%, #449a92 75%, #2f7570 100%)',
        }}
      />

      <div className="relative mx-auto grid max-w-[1280px] grid-cols-1 items-end gap-0 px-6 pt-10 sm:px-10 md:min-h-[620px] md:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] md:gap-6 md:px-8 lg:min-h-[700px] lg:grid-cols-2 lg:gap-10 lg:px-12 lg:pt-0 xl:px-14">
        <div className="flex flex-col justify-between pb-8 md:py-14 lg:py-16 lg:pt-24">
          <div className="max-w-[520px]">
            <h1 className="text-[1.9rem] leading-[1.2] tracking-tight text-slate-900 sm:text-[2.2rem] lg:text-[2.55rem] lg:leading-[1.16]">
              The <span className="font-bold text-teal-800">Best Medical</span> and Treatment Center for You
            </h1>

            <p className="mt-5 max-w-[440px] text-[15px] leading-7 text-slate-600 sm:text-base">
              We understand that injuries and acute pain can happen unexpectedly. Our emergency
              support and verified partner pharmacies help you get the care you need, when you need it.
            </p>

            <Link
              className="mt-7 inline-flex cursor-pointer items-center justify-center rounded-full bg-teal-700 px-9 py-3.5 text-[15px] font-semibold text-white shadow-[0_8px_24px_rgba(15,118,110,0.25)] transition hover:bg-teal-800 hover:shadow-[0_10px_28px_rgba(15,118,110,0.3)] lg:mt-8"
              to="/products"
            >
              View Products
            </Link>
          </div>

          <div className="mt-10 grid max-w-[500px] grid-cols-3 gap-4 border-t border-white/25 pt-8 text-white sm:gap-6 md:mt-8 lg:mt-10">
            {stats.map((item) => (
              <div key={item.label}>
                <p className="text-[1.7rem] font-bold leading-none sm:text-[1.9rem] lg:text-[2rem]">
                  {item.value}
                </p>
                <p className="mt-2 text-xs leading-snug text-white/90 sm:text-sm">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative flex w-full items-end justify-center overflow-visible leading-none md:justify-end md:self-end lg:-mr-16 xl:-mr-20">
          <img
            alt="Healthcare professional ready to assist"
            className="block h-auto max-h-[min(680px,88vh)] w-full max-w-[620px] origin-bottom translate-x-8 scale-110 object-contain object-bottom drop-shadow-[0_18px_40px_rgba(0,0,0,0.18)] sm:max-w-[520px] md:max-w-[480px] lg:max-h-[720px] lg:max-w-[680px] lg:translate-x-20 lg:scale-[1.15]"
            draggable={false}
            src={heroImage}
          />
        </div>
      </div>
    </section>
  )
}

export default Hero
