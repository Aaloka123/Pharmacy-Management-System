import CtaImage from '../assets/cta.png'
import { NavLink } from 'react-router-dom'

const AboutCTA = () => {
  return (
    <section className="relative mt-12 w-full overflow-hidden px-[80px] py-12 text-white md:py-14">
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${CtaImage})` }}
      />
      <div aria-hidden="true" className="absolute inset-0 bg-slate-900/55" />
      <div className="relative z-10 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-4xl font-bold tracking-tight">Partner with 100+ Trusted Pharmacies</h2>
          <p className="mt-3 max-w-3xl text-[16px] leading-8 text-white/90">
            Join our multi-vendor network to expand your pharmacy reach, improve medicine accessibility, and deliver better care to more
            communities.
          </p>
        </div>
        <NavLink className="rounded-full bg-white px-7 py-3 text-[16px] font-semibold text-teal-700 transition hover:bg-slate-100" to="/vendorsignup">
          Become a Vendor
        </NavLink>
      </div>
    </section>
  )
}

export default AboutCTA