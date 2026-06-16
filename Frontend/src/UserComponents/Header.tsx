import { useCallback, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  LuHouse,
  LuInfo,
  LuLogIn,
  LuLogOut,
  LuMenu,
  LuPackage,
  LuPackageSearch,
  LuPhone,
  LuShoppingCart,
  LuX,
} from 'react-icons/lu'
import type { IconType } from 'react-icons'
import { toast } from 'react-toastify'
import mednexuxLogo from '../assets/Mednexux.png'
import UserNotificationBell from './UserNotificationBell'
import { resolveProfileImageUrl } from '../lib/api'
import { clearAuthSession, getAccessToken, getStoredUser, onAuthChange, type AuthUser } from '../lib/auth'
import { fetchCart } from '../lib/cartApi'
import { isCartUserLoggedIn, onCartChanged } from '../lib/cartStorage'

const NAV_LINKS: { to: string; label: string; end?: boolean; icon: IconType }[] = [
  { to: '/', label: 'Home', end: true, icon: LuHouse },
  { to: '/products', label: 'Product', icon: LuPackage },
  { to: '/about', label: 'About', icon: LuInfo },
  { to: '/contacts', label: 'Contacts', icon: LuPhone },
]

const Header = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const baseLinkClass =
    'rounded-lg px-3.5 py-2 text-[14px] font-medium text-slate-700 transition duration-200 hover:text-teal-700'
  const activeLinkClass = 'text-teal-700'
  const mobileLinkClass =
    'flex items-center gap-3 rounded-xl px-4 py-3 text-base font-medium text-slate-800 transition hover:bg-slate-50 hover:text-teal-700'

  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser())
  const [cartCount, setCartCount] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const isLoggedIn = Boolean(user && getAccessToken())
  const avatarUrl = user ? resolveProfileImageUrl(user.profileImage) : null
  const userInitial = (user?.fullName?.trim().charAt(0) || user?.email?.trim().charAt(0) || 'U').toUpperCase()

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

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  const handleLogout = () => {
    closeMenu()
    clearAuthSession()
    toast.info('You have been logged out.')
    navigate('/login')
  }

  const mobileMenu = menuOpen
    ? createPortal(
        <>
          <button
            aria-label="Close menu"
            className="mobile-menu-backdrop fixed inset-0 z-[200] bg-slate-900/50 lg:hidden"
            onClick={closeMenu}
            type="button"
          />
          <div
            className="mobile-menu-panel fixed inset-y-0 right-0 z-[201] flex h-dvh w-[min(100vw,20rem)] flex-col border-l border-slate-200 bg-[#F8FAFC] shadow-2xl lg:hidden"
            id="mobile-nav"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4">
              <p className="text-sm font-semibold text-slate-900">Menu</p>
              <button
                aria-label="Close menu"
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center text-slate-700 transition hover:text-teal-700"
                onClick={closeMenu}
                type="button"
              >
                <LuX className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              <div className="relative mb-6">
                <svg
                  aria-hidden="true"
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="m21 21-4.35-4.35m1.85-5.15a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
                <input
                  className="w-full rounded-full border border-slate-200 bg-white py-2.5 pl-9 pr-4 text-[14px] text-slate-700 outline-none transition focus:border-teal-500"
                  placeholder="Search..."
                  type="text"
                />
              </div>

              {isLoggedIn && user ? (
                <NavLink
                  className="mb-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 transition hover:border-teal-200 hover:bg-teal-50/50"
                  onClick={closeMenu}
                  to="/profile"
                >
                  {avatarUrl ? (
                    <img
                      alt=""
                      className="h-12 w-12 shrink-0 rounded-full border border-slate-200 object-cover"
                      referrerPolicy="no-referrer"
                      src={avatarUrl}
                    />
                  ) : (
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-teal-600 to-teal-700 text-lg font-bold text-white">
                      {userInitial}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{user.fullName || 'User'}</p>
                    <p className="truncate text-xs text-slate-500">{user.email}</p>
                  </div>
                </NavLink>
              ) : null}

              <div className="space-y-1">
                {NAV_LINKS.map((link) => {
                  const Icon = link.icon
                  return (
                    <NavLink
                      className={({ isActive }) =>
                        `${mobileLinkClass} ${isActive ? 'bg-teal-50 font-semibold text-teal-700' : ''}`
                      }
                      end={link.end}
                      key={link.to}
                      onClick={closeMenu}
                      to={link.to}
                    >
                      <Icon className="h-5 w-5 shrink-0 text-teal-700" strokeWidth={2} />
                      <span>{link.label}</span>
                    </NavLink>
                  )
                })}
              </div>

              {!isLoggedIn ? (
                <NavLink
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-br from-teal-600 to-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm"
                  onClick={closeMenu}
                  to="/login"
                >
                  <LuLogIn className="h-5 w-5 shrink-0" strokeWidth={2} />
                  Login
                </NavLink>
              ) : (
                <div className="mt-6 space-y-2 border-t border-slate-200 pt-5">
                  {isCartUserLoggedIn() ? (
                    <NavLink
                      className={({ isActive }) =>
                        `${mobileLinkClass} ${isActive ? 'bg-teal-50 font-semibold text-teal-700' : ''}`
                      }
                      onClick={closeMenu}
                      to="/cart"
                    >
                      <LuShoppingCart className="h-5 w-5 shrink-0 text-teal-700" strokeWidth={2} />
                      <span>Cart{cartCount > 0 ? ` (${cartCount})` : ''}</span>
                    </NavLink>
                  ) : null}
                  <NavLink
                    className={({ isActive }) =>
                      `${mobileLinkClass} ${isActive ? 'bg-teal-50 font-semibold text-teal-700' : ''}`
                    }
                    onClick={closeMenu}
                    to="/ordertracking"
                  >
                    <LuPackageSearch className="h-5 w-5 shrink-0 text-teal-700" strokeWidth={2} />
                    <span>Order Tracking</span>
                  </NavLink>
                </div>
              )}
            </div>

            {isLoggedIn ? (
              <div className="shrink-0 border-t border-slate-200 px-5 py-4">
                <button
                  className={`${mobileLinkClass} w-full cursor-pointer text-rose-600 hover:bg-rose-50 hover:text-rose-700`}
                  onClick={handleLogout}
                  type="button"
                >
                  <LuLogOut className="h-5 w-5 shrink-0" strokeWidth={2} />
                  <span>Logout</span>
                </button>
              </div>
            ) : null}
          </div>
        </>,
        document.body,
      )
    : null

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-[#F8FAFC] px-4 py-2.5 shadow-[0_8px_24px_rgba(15,23,42,0.06)] backdrop-blur md:px-8 lg:px-[80px]">
      <nav className="flex w-full items-center justify-between gap-3">
        <NavLink className="inline-flex shrink-0 items-center" onClick={closeMenu} to="/">
          <img alt="MedNexus logo" className="h-10 w-auto object-contain sm:h-12" src={mednexuxLogo} />
        </NavLink>

        <div className="hidden items-center gap-1.5 lg:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              className={({ isActive }) => `${baseLinkClass} ${isActive ? activeLinkClass : ''}`}
              end={link.end}
              key={link.to}
              to={link.to}
            >
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center justify-end gap-1">
          <div className="relative hidden md:block">
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="m21 21-4.35-4.35m1.85-5.15a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
            <input
              className="w-40 rounded-full border border-slate-200 bg-slate-50 py-2 pl-9 pr-4 text-[14px] text-slate-700 outline-none transition duration-200 hover:border-slate-300 focus:border-teal-500 focus:bg-white lg:w-52"
              placeholder="Search..."
              type="text"
            />
          </div>

          {isLoggedIn ? (
            <>
              {isCartUserLoggedIn() ? (
                <>
                  <UserNotificationBell />
                  <NavLink
                    aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : 'Cart'}
                    className={({ isActive }) =>
                      `relative flex h-10 w-10 shrink-0 items-center justify-center text-slate-700 transition duration-200 hover:text-teal-700 ${
                        isActive ? 'text-teal-700' : ''
                      }`
                    }
                    onClick={closeMenu}
                    title="Cart"
                    to="/cart"
                  >
                    <LuShoppingCart className="h-5 w-5" strokeWidth={2} />
                    {cartCount > 0 ? (
                      <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full border border-slate-200 bg-white px-1 text-[10px] font-semibold tabular-nums text-teal-700 shadow-sm">
                        {cartCount}
                      </span>
                    ) : null}
                  </NavLink>
                </>
              ) : null}
              <div className="hidden lg:block">
                <NavLink
                  aria-label="Profile"
                  className={({ isActive }) =>
                    `flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border text-xs font-bold transition duration-200 ${
                      isActive ? 'border-teal-700 ring-2 ring-teal-600/30' : 'border-slate-200 hover:border-teal-400'
                    }`
                  }
                  onClick={closeMenu}
                  title={user?.email}
                  to="/profile"
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
                      {userInitial}
                    </span>
                  )}
                </NavLink>
              </div>
            </>
          ) : (
            <NavLink
              className="hidden rounded-lg border border-transparent bg-linear-to-br from-teal-600 to-teal-700 px-4 py-2 text-[14px] font-semibold text-white shadow-sm shadow-teal-900/20 transition duration-200 hover:from-teal-700 hover:to-teal-800 sm:inline-flex sm:px-5"
              onClick={closeMenu}
              to="/login"
            >
              Login
            </NavLink>
          )}

          <button
            aria-controls="mobile-nav"
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center text-slate-700 transition hover:text-teal-700 lg:hidden"
            onClick={() => setMenuOpen((open) => !open)}
            type="button"
          >
            {menuOpen ? <LuX className="h-5 w-5" strokeWidth={2} /> : <LuMenu className="h-5 w-5" strokeWidth={2} />}
          </button>
        </div>
      </nav>

      {mobileMenu}
    </header>
  )
}

export default Header
