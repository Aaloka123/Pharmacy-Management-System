import DoctorsImage from '../assets/Doctors.webp'
import { HiOutlineBuildingStorefront, HiOutlineCheckCircle } from 'react-icons/hi2'
import { FiClock } from 'react-icons/fi'
import { NavLink } from 'react-router-dom'

const Aboutuscontent = () => {
  return (
    <main className="px-[80px] py-10">
      <section>
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2">
          <div className="overflow-hidden rounded-2xl">
            <img alt="Doctors and pharmacy team" className="h-[560px] w-full object-cover" src={DoctorsImage} />
          </div>

          <div>
            <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-900">Your Trusted Multi-Vendor Pharmacy Platform</h1>
            <p className="mt-4 text-base leading-7 text-slate-600">
              We are a multi-vendor pharmacy platform connecting customers with verified medicine providers in one secure marketplace. Our
              mission is to make healthcare products easier to access, compare, and order from home.
            </p>
            <p className="mt-4 text-base leading-7 text-slate-600">
              With a growing network of <span className="font-semibold text-slate-800">100+ partner pharmacies</span>, we offer broad product
              availability, trusted quality, and reliable delivery support for everyday medical needs.
            </p>
            <p className="mt-4 text-base leading-7 text-slate-600">
              From prescription medicines to wellness essentials, we focus on transparent service, verified vendors, and a smooth digital
              ordering experience.
            </p>
            <div className="mt-6 grid grid-cols-1 gap-4 text-base font-medium text-slate-700 sm:grid-cols-3">
              <span className="inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4">
                <HiOutlineBuildingStorefront aria-hidden="true" className="h-7 w-7 text-teal-700" />
                <span>
                  <span className="font-bold text-teal-700">100+</span> Partner Pharmacies
                </span>
              </span>
              <span className="inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4">
                <FiClock aria-hidden="true" className="h-7 w-7 text-teal-700" />
                <span>
                  <span className="font-bold text-teal-700">24/7</span> Platform Access
                </span>
              </span>
              <span className="inline-flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4">
                <HiOutlineCheckCircle aria-hidden="true" className="h-7 w-7 text-teal-700" />
                <span>
                  <span className="font-bold text-teal-700">Trusted</span> Verified Vendors
                </span>
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-14 pb-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">What Makes Us Different</h2>
        <div className="mt-6 grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="inline-flex items-center gap-2 text-lg font-bold text-slate-900">
              <HiOutlineBuildingStorefront aria-hidden="true" className="h-7 w-7 text-teal-700" />
              Multi-Vendor Network
            </h3>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              We bring together independent and established pharmacies into one unified platform so customers can compare products and prices
              more easily.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="inline-flex items-center gap-2 text-lg font-bold text-slate-900">
              <HiOutlineCheckCircle aria-hidden="true" className="h-7 w-7 text-teal-700" />
              Verified Quality
            </h3>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              Every listed vendor follows quality and compliance requirements, helping ensure safe medicines and reliable pharmacy standards.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h3 className="inline-flex items-center gap-2 text-lg font-bold text-slate-900">
              <FiClock aria-hidden="true" className="h-7 w-7 text-teal-700" />
              Faster Access
            </h3>
            <p className="mt-2 text-sm leading-7 text-slate-600">
              With digital browsing and ordering, customers can quickly find the medicines they need while pharmacies can serve more efficiently.
            </p>
          </div>
        </div>
      </section>

      <section className="mx-[-80px] mt-12 w-auto rounded-none bg-linear-to-r from-teal-700 to-cyan-700 px-[80px] py-12 text-white md:py-14">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-4xl font-bold tracking-tight">Partner with 100+ Trusted Pharmacies</h2>
            <p className="mt-3 max-w-3xl text-[16px] leading-8 text-white/90">
              Join our multi-vendor network to expand your pharmacy reach, improve medicine accessibility, and deliver better care to more
              communities.
            </p>
          </div>
          <NavLink
            className="rounded-full bg-white px-7 py-3 text-[16px] font-semibold text-teal-700 transition hover:bg-slate-100"
            to="/vendorsignup"
          >
            Become a Vendor
          </NavLink>
        </div>
      </section>

      <section className="mt-12 pb-6">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">Our Commitment to Better Care Access</h2>
        <p className="mt-4 w-full text-[14px] leading-7 text-slate-600">
          We believe access to essential medicines should be simple, transparent, and dependable. That is why we continue to strengthen our
          multi-vendor ecosystem, improve product availability, and support pharmacies with tools that help them serve customers faster.
        </p>
        <p className="mt-3 w-full text-[14px] leading-7 text-slate-600">
          As we grow, our focus remains on verified quality, responsible pharmacy practices, and a user-friendly experience for both patients
          and partner pharmacies. Every improvement we build is aimed at making healthcare access more practical for everyday needs.
        </p>
      </section>
    </main>
  )
}

export default Aboutuscontent
