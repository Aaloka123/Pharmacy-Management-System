import { NavLink } from 'react-router-dom'

const Header = () => {
  const baseLinkClass =
    'rounded-lg px-3.5 py-2 text-[14px] font-medium text-slate-700 transition duration-200 hover:text-teal-700'
  const activeLinkClass =
    'text-teal-700'

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 px-[80px] py-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] backdrop-blur">
      <nav className="flex w-full items-center justify-between">
        <div className="flex-1 text-3xl font-bold tracking-tight text-slate-900">
          Med<span className="text-teal-700">Nexus</span>
        </div>
        <div className="hidden items-center gap-1.5 md:flex">
          <NavLink
            className={({ isActive }) => `${baseLinkClass} ${isActive ? activeLinkClass : ''}`}
            end
            to="/"
          >
            Home
          </NavLink>
          <NavLink
            className={({ isActive }) => `${baseLinkClass} ${isActive ? activeLinkClass : ''}`}
            to="/products"
          >
            Product
          </NavLink>
          <NavLink
            className={({ isActive }) => `${baseLinkClass} ${isActive ? activeLinkClass : ''}`}
            to="/about"
          >
            About
          </NavLink>
          <NavLink
            className={({ isActive }) => `${baseLinkClass} ${isActive ? activeLinkClass : ''}`}
            to="/contacts"
          >
            Contacts
          </NavLink>
        </div>
        <div className="flex flex-1 items-center justify-end gap-3">
          <div className="relative hidden md:block">
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="m21 21-4.35-4.35m1.85-5.15a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
            </svg>
            <input
              className="w-52 rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-[14px] text-slate-700 outline-none transition duration-200 hover:border-slate-300 focus:border-teal-500 focus:bg-white"
              placeholder="Search..."
              type="text"
            />
          </div>
          <NavLink
            className="rounded-lg border border-transparent bg-linear-to-br from-teal-600 to-teal-700 px-5 py-2 text-[14px] font-semibold text-white shadow-sm shadow-teal-900/20 transition duration-200 hover:from-teal-700 hover:to-teal-800"
            to="/login"
          >
            Login
          </NavLink>
        </div>
      </nav>
    </header>
  )
}

export default Header