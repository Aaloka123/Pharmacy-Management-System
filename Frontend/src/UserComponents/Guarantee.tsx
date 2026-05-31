import { FiClock, FiRefreshCw, FiShield, FiTruck } from 'react-icons/fi'

const guarantees = [
  {
    title: '24 Hour Service',
    description: 'Pharmacy support around the clock for urgent needs.',
    icon: FiClock,
    iconBg: 'bg-teal-100 text-teal-700',
    ring: 'ring-teal-100',
    hoverBorder: 'hover:border-teal-200',
  },
  {
    title: 'Home Delivery',
    description: 'Medicines delivered safely to your doorstep.',
    icon: FiTruck,
    iconBg: 'bg-sky-100 text-sky-700',
    ring: 'ring-sky-100',
    hoverBorder: 'hover:border-sky-200',
  },
  {
    title: 'Return Option',
    description: 'Hassle-free returns on eligible products.',
    icon: FiRefreshCw,
    iconBg: 'bg-amber-100 text-amber-700',
    ring: 'ring-amber-100',
    hoverBorder: 'hover:border-amber-200',
  },
  {
    title: 'Free Health Checkup',
    description: 'Complimentary basic health screening for members.',
    icon: FiShield,
    iconBg: 'bg-emerald-100 text-emerald-700',
    ring: 'ring-emerald-100',
    hoverBorder: 'hover:border-emerald-200',
  },
] as const

const Guarantee = () => (
  <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 via-white to-slate-50 px-4 py-16 md:px-8">
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -left-24 top-8 h-56 w-56 rounded-full bg-teal-200/30 blur-3xl"
    />
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -right-20 bottom-0 h-64 w-64 rounded-full bg-sky-200/30 blur-3xl"
    />

    <div className="relative mx-auto max-w-[1200px]">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-10 lg:grid-cols-4 lg:gap-8">
        {guarantees.map((item) => {
          const Icon = item.icon

          return (
            <article
              key={item.title}
              className={`group relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 p-6 shadow-sm backdrop-blur-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg ${item.hoverBorder}`}
            >
              <div
                aria-hidden="true"
                className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-slate-100/80 transition duration-300 group-hover:scale-110"
              />

              <div
                className={`relative inline-flex h-14 w-14 items-center justify-center rounded-2xl ring-4 ${item.iconBg} ${item.ring}`}
              >
                <Icon aria-hidden="true" className="h-7 w-7" />
              </div>

              <h3 className="relative mt-5 text-lg font-bold text-slate-900">{item.title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>

              <div className="relative mt-5 h-0.5 w-10 rounded-full bg-slate-200 transition-all duration-300 group-hover:w-16 group-hover:bg-teal-500" />
            </article>
          )
        })}
      </div>
    </div>
  </section>
)

export default Guarantee
