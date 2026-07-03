import { NavLink } from 'react-router-dom'

const AboutCTA = () => {
  return (
    <section
      className="relative my-12 w-full overflow-hidden px-4 py-14 text-white md:px-8 md:py-16 lg:px-[80px] lg:py-20"
      style={{
        background: 'linear-gradient(180deg, #7FCBC3 0%, #4DB6AB 48%, #2f7570 100%)',
      }}
    >
      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between md:gap-10">
        <div>
          <h2 className="text-[1.75rem] font-bold tracking-tight md:text-[2.35rem] lg:text-[2.5rem]">
            Partner with 100+ Trusted Pharmacies
          </h2>
          <p className="mt-4 max-w-3xl text-[17px] leading-8 text-white/90 md:text-lg md:leading-8">
            Join our multi-vendor network to expand your pharmacy reach, improve medicine accessibility, and deliver
            better care to more communities.
          </p>
        </div>
        <NavLink
          className="shrink-0 cursor-pointer rounded-full bg-white px-8 py-3.5 text-[17px] font-semibold text-teal-700 transition hover:bg-white/90 md:px-9 md:py-4 md:text-lg"
          to="/vendorsignup"
        >
          Become a Vendor
        </NavLink>
      </div>
    </section>
  )
}

export default AboutCTA
