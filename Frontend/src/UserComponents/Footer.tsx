import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import mednexuxLogo from '../assets/Mednexux.png'
import { getStoredUser, onAuthChange } from '../lib/auth'

const Footer = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => getStoredUser() != null)

  useEffect(() => {
    const unsubscribe = onAuthChange(() => {
      setIsLoggedIn(getStoredUser() != null)
    })
    return unsubscribe
  }, [])

  return (
    <footer className="border-t border-slate-200 bg-[#F8FAFC]">
      <div className="px-4 py-12 md:px-8 lg:px-[80px]">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="lg:pr-8">
            <img alt="MedNexus logo" className="h-12 w-auto object-contain" src={mednexuxLogo} />
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
              {!isLoggedIn ? (
                <li>
                  <NavLink className="font-semibold text-teal-700 underline underline-offset-2 transition hover:text-teal-800" to="/vendorsignup">
                    Become a vendor
                  </NavLink>
                </li>
              ) : null}
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