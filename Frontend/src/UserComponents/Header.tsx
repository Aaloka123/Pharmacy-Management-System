import { useCallback, useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { LuShoppingCart } from 'react-icons/lu'
import mednexuxLogo from '../assets/Mednexux.png'
import { resolveProfileImageUrl } from '../lib/api'
import { getStoredUser, onAuthChange, type AuthUser } from '../lib/auth'
import { fetchCart } from '../lib/cartApi'
import { isCartUserLoggedIn, onCartChanged } from '../lib/cartStorage'

const Header = () => {
  const baseLinkClass =
    'rounded-lg px-3.5 py-2 text-[14px] font-medium text-slate-700 transition duration-200 hover:text-teal-700'
  const activeLinkClass =
    'text-teal-700'

  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser())
  const [cartCount, setCartCount] = useState(0)
  const avatarUrl = user ? resolveProfileImageUrl(user.profileImage) : null

  const refreshCartCount = useCallback(async () => {
    if (!isCartUserLoggedIn()) {
      setCartCount(0)
      return
    }
    try {
      const lines = await fetchCart()
      setCartCount(lines.length)
    } catch {
      setCartCount(0)
    }
  }, [])

  useEffect(() => {
    const unsubscribe = onAuthChange(() => {
      setUser(getStoredUser())
      void refreshCartCount()
    })
    return unsubscribe
  }, [refreshCartCount])

  useEffect(() => {
    void refreshCartCount()
    const unsubscribe = onCartChanged(() => {
      void refreshCartCount()
    })
    return unsubscribe
  }, [refreshCartCount])

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-[#F8FAFC] px-[80px] py-2.5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] backdrop-blur">
      <nav className="flex w-full items-center justify-between">
        <div className="flex-1">
          <NavLink className="inline-flex items-center" to="/">
            <img alt="MedNexus logo" className="h-12 w-auto object-contain" src={mednexuxLogo} />
          </NavLink>
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
        <div className="flex flex-1 items-center justify-end gap-4">
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
              className="w-52 rounded-full border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-[14px] text-slate-700 outline-none transition duration-200 hover:border-slate-300 focus:border-teal-500 focus:bg-white"
              placeholder="Search..."
              type="text"
            />
          </div>
          {user ? (
            <>
              <NavLink
                aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : 'Cart'}
                title="Cart"
                to="/cart"
                className={({ isActive }) =>
                  `relative flex h-10 w-10 shrink-0 items-center justify-center text-slate-700 transition duration-200 hover:text-teal-700 ${
                    isActive ? 'text-teal-700' : ''
                  }`
                }
              >
                <LuShoppingCart className="h-5 w-5" strokeWidth={2} />
                {cartCount > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border border-slate-200 bg-white px-1 text-[10px] font-semibold tabular-nums text-teal-700 shadow-sm">
                    {cartCount}
                  </span>
                ) : null}
              </NavLink>
              <NavLink
                aria-label="Profile"
                title={user.email}
                to="/profile"
                className={({ isActive }) =>
                  `flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border text-xs font-bold transition duration-200 ${
                    isActive
                      ? 'border-teal-700 ring-2 ring-teal-600/30'
                      : 'border-slate-200 hover:border-teal-400'
                  }`
                }
              >
                {avatarUrl ? (
                  <img
                    alt="Profile"
                    className="h-full w-full object-cover"
                    referrerPolicy="no-referrer"
                    src={avatarUrl}
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center bg-linear-to-br from-teal-600 to-teal-700 text-white">
                    {(user.fullName.trim().charAt(0) || user.email.trim().charAt(0) || 'U').toUpperCase()}
                  </span>
                )}
              </NavLink>
            </>
          ) : (
            <NavLink
              className="rounded-lg border border-transparent bg-linear-to-br from-teal-600 to-teal-700 px-5 py-2 text-[14px] font-semibold text-white shadow-sm shadow-teal-900/20 transition duration-200 hover:from-teal-700 hover:to-teal-800"
              to="/login"
            >
              Login
            </NavLink>
          )}
        </div>
      </nav>
    </header>
  )
}

export default Header
