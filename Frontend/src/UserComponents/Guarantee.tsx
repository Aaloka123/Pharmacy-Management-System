import { FiClock, FiRefreshCw, FiShield, FiTruck } from 'react-icons/fi'

const Guarantee = () => {
  const guarantees = [
    {
      title: '24 Hour Service',
      icon: FiClock,
    },
    {
      title: 'Home Delivery',
      icon: FiTruck,
    },
    {
      title: 'Return Option',
      icon: FiRefreshCw,
    },
    {
      title: 'Free Health Checkup',
      icon: FiShield,
    },
  ]

  return (
    <section className="bg-white px-6 py-12 md:px-12">
      <div className="mx-auto max-w-[1200px]">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {guarantees.map((item) => {
            const Icon = item.icon

            return (
              <article
                key={item.title}
                className="group flex min-h-[170px] flex-col items-center justify-center rounded-2xl border border-slate-300 bg-white p-5 text-center transition-colors duration-200 hover:border-teal-700 hover:bg-teal-700"
              >
                <div className="mb-4 text-black transition-colors duration-200 group-hover:text-white">
                  <Icon aria-hidden="true" className="h-10 w-10" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 transition-colors duration-200 group-hover:text-white">{item.title}</h3>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default Guarantee