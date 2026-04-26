import { NavLink } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="border-t border-slate-200 bg-[#F8FAFC]">
      <div className="py-12 pl-[90px] pr-[90px]">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:pr-8">
            <h3 className="text-3xl font-semibold tracking-tight text-slate-900">
              Med<span className="text-teal-700">Nexus</span>
            </h3>
            <p className="mt-4 max-w-xs text-[14px] leading-6 text-slate-600">
              A modern pharmacy management platform built for safer workflows, faster operations, and better care
              outcomes.
            </p>
          </div>

          <div>
            <h4 className="text-[16px] font-[600] text-teal-700">Quick Links</h4>
            <ul className="mt-4 space-y-2.5 text-[14px] text-slate-600">
              <li>
                <NavLink className={({ isActive }) => `transition hover:text-slate-900 ${isActive ? 'font-[600] text-slate-900' : ''}`} end to="/">
                  Home
                </NavLink>
              </li>
              <li>
                <NavLink className={({ isActive }) => `transition hover:text-slate-900 ${isActive ? 'font-[600] text-slate-900' : ''}`} to="/products">
                  Product
                </NavLink>
              </li>
              <li>
                <NavLink className={({ isActive }) => `transition hover:text-slate-900 ${isActive ? 'font-[600] text-slate-900' : ''}`} to="/about">
                  About
                </NavLink>
              </li>
              <li>
                <NavLink className={({ isActive }) => `transition hover:text-slate-900 ${isActive ? 'font-[600] text-slate-900' : ''}`} to="/contacts">
                  Contacts
                </NavLink>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-[16px] font-[600] text-teal-700">Company</h4>
            <ul className="mt-4 space-y-2.5 text-[14px] text-slate-600">
              <li>
                <a className="transition hover:text-teal-700" href="#">
                  About Us
                </a>
              </li>
              <li>
                <a className="transition hover:text-teal-700" href="#">
                  Careers
                </a>
              </li>
              <li>
                <a className="transition hover:text-teal-700" href="#">
                  Blog
                </a>
              </li>
              <li>
                <NavLink className="font-semibold text-teal-700 underline underline-offset-2 transition hover:text-teal-800" to="/vendorsignup">
                  Become a vendor
                </NavLink>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-[16px] font-[600] text-teal-700">Support</h4>
            <ul className="mt-4 space-y-2.5 text-[14px] text-slate-600">
              <li>
                <a className="transition hover:text-teal-700" href="#">
                  Help Center
                </a>
              </li>
              <li>
                <a className="transition hover:text-teal-700" href="#">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a className="transition hover:text-teal-700" href="#">
                  Terms of Service
                </a>
              </li>
              <li>
                <a className="transition hover:text-teal-700" href="#">
                  Contact Support
                </a>
              </li>
            </ul>
          </div>
        </div>

      </div>
    </footer>
  )
}

export default Footer