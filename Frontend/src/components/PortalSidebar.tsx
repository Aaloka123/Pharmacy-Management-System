import { useEffect, useState, type ComponentType } from 'react'
import { createPortal } from 'react-dom'
import { NavLink, useLocation } from 'react-router-dom'
import { LuLogOut, LuMenu, LuX } from 'react-icons/lu'
import mednexuxLogo from '../assets/Mednexux.png'

export type PortalMenuItem = {
  label: string
  Icon: ComponentType<{ className?: string }>
  to: string
  badge?: number
}

type PortalSidebarProps = {
  subtitle: string
  menuItems: PortalMenuItem[]
  onLogout: () => void
  menuId: string
}

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[14px] font-medium transition ${
    isActive ? 'bg-teal-50 text-teal-700' : 'text-slate-700 hover:bg-teal-50 hover:text-teal-700'
  }`

const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium text-teal-700 transition hover:bg-teal-50 ${
    isActive ? 'bg-teal-50' : ''
  }`

const mobileLogoutClass =
  'flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] font-medium text-rose-600 transition hover:bg-rose-50 hover:text-rose-700'

function MenuLinks({
  items,
  linkClassName,
  onNavigate,
  variant = 'desktop',
}: {
  items: PortalMenuItem[]
  linkClassName: typeof linkClass
  onNavigate?: () => void
  variant?: 'desktop' | 'mobile'
}) {
  const iconClass =
    variant === 'mobile' ? 'h-5 w-5 shrink-0 text-teal-700' : 'h-[18px] w-[18px] shrink-0 text-teal-700'

  return (
    <>
      {items.map(({ label, Icon, to, badge }) => (
        <NavLink className={linkClassName} key={label} onClick={onNavigate} to={to}>
          <Icon className={iconClass} />
          <span className="truncate">{label}</span>
          {badge && badge > 0 ? (
            <span
              aria-label={`${badge} notifications`}
              className="ml-auto inline-flex min-w-[20px] items-center justify-center rounded-full bg-rose-600 px-1.5 text-[11px] font-semibold text-white"
            >
              {badge > 99 ? '99+' : badge}
            </span>
          ) : null}
        </NavLink>
      ))}
    </>
  )
}

export default function PortalSidebar({ subtitle, menuItems, onLogout, menuId }: PortalSidebarProps) {
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

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
    onLogout()
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
            id={menuId}
          >
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4">
              <p className="text-sm font-medium text-teal-700">Menu</p>
              <button
                aria-label="Close menu"
                className="inline-flex h-9 w-9 cursor-pointer items-center justify-center text-slate-700 transition hover:text-teal-700"
                onClick={closeMenu}
                type="button"
              >
                <LuX className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>

            <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto px-5 py-5">
              <MenuLinks
                items={menuItems}
                linkClassName={mobileLinkClass}
                onNavigate={closeMenu}
                variant="mobile"
              />
            </nav>

            <div className="shrink-0 border-t border-slate-200 px-5 py-4">
              <button className={mobileLogoutClass} onClick={handleLogout} type="button">
                <LuLogOut className="h-5 w-5 shrink-0" strokeWidth={2} />
                Logout
              </button>
            </div>
          </div>
        </>,
        document.body,
      )
    : null

  return (
    <>
      <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm lg:hidden">
        <div className="flex min-w-0 items-center gap-2">
          <img alt="MedNexus logo" className="h-8 w-auto shrink-0 object-contain" src={mednexuxLogo} />
        </div>
        <button
          aria-controls={menuId}
          aria-expanded={menuOpen}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          className="inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center text-slate-700 transition hover:text-teal-700"
          onClick={() => setMenuOpen((open) => !open)}
          type="button"
        >
          {menuOpen ? <LuX className="h-5 w-5" strokeWidth={2} /> : <LuMenu className="h-5 w-5" strokeWidth={2} />}
        </button>
      </header>

      <aside className="sticky top-0 hidden h-screen w-[280px] min-w-[280px] shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-6 shadow-sm lg:flex">
        <div className="mb-8 flex flex-col items-center justify-center">
          <img alt="MedNexus logo" className="h-12 w-auto object-contain" src={mednexuxLogo} />
          <p className="mt-6 text-center text-xs font-medium text-slate-600">{subtitle}</p>
        </div>

        <nav className="flex flex-col gap-2">
          <MenuLinks items={menuItems} linkClassName={linkClass} />
        </nav>

        <button
          className="mt-auto flex w-full cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-[14px] font-semibold text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
          onClick={handleLogout}
          type="button"
        >
          <LuLogOut className="h-[18px] w-[18px] shrink-0" />
          Logout
        </button>
      </aside>

      {mobileMenu}
    </>
  )
}
