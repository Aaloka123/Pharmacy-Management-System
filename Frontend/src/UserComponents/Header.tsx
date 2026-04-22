import { NavLink } from 'react-router-dom'

const Header = () => {
  const baseLinkClass =
    'rounded-lg px-3.5 py-2 text-sm font-medium text-slate-700 transition duration-200 hover:bg-slate-100 hover:text-teal-700'
  const activeLinkClass =
    'bg-gradient-to-br from-teal-600 to-teal-700 text-white shadow-sm shadow-teal-900/20 hover:from-teal-700 hover:to-teal-800 hover:text-white'

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 px-6 py-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] backdrop-blur md:px-8">
      <nav className="mx-auto flex max-w-[1200px] items-center justify-between">
        <div className="flex-1 text-2xl font-bold tracking-tight text-slate-900">
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
        <div className="flex flex-1 justify-end">
          <NavLink
            className="rounded-lg border border-transparent bg-linear-to-br from-teal-600 to-teal-700 px-5 py-2 text-sm font-semibold text-white shadow-sm shadow-teal-900/20 transition duration-200 hover:from-teal-700 hover:to-teal-800"
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