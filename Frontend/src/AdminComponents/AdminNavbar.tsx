import {
  LuBadgeCheck,
  LuLayoutDashboard,
  LuLogOut,
  LuPackage,
  LuSettings,
  LuStar,
  LuStore,
  LuUsers,
} from 'react-icons/lu'
import { NavLink, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import mednexuxLogo from '../assets/Mednexux.png'
import { clearStoredUser } from '../lib/auth'

const menuItems = [
  { label: 'Dashboard', Icon: LuLayoutDashboard, to: '/admindashboard' },
  { label: 'User', Icon: LuUsers, to: '/adminusers' },
  { label: 'Vendor', Icon: LuStore, to: '/adminvendors' },
  { label: 'Approve Vendor', Icon: LuBadgeCheck, to: '/adminapprovevendor' },
  { label: 'Product', Icon: LuPackage, to: '/adminproducts' },
  { label: 'Review', Icon: LuStar, to: '/adminreviews' },
  { label: 'Setting', Icon: LuSettings, to: '/adminsettings' },
]

const AdminNavbar = () => {
  const navigate = useNavigate()

  const handleLogout = () => {
    clearStoredUser()
    toast.error('You have been logged out.')
    navigate('/login')
  }

  return (
    <aside className="sticky top-0 flex h-screen w-[280px] min-w-[280px] shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-6 shadow-sm">
      <div className="mb-8 flex flex-col items-center justify-center">
        <img alt="MedNexus logo" className="h-12 w-auto object-contain" src={mednexuxLogo} />
        <p className="mt-6 text-center text-xs font-medium text-slate-600">MedNexus Admin</p>
      </div>

      <nav className="flex flex-col gap-2">
        {menuItems.map(({ label, Icon, to }) => (
          <NavLink
            key={label}
            to={to}
            className={({ isActive }) =>
              `flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[14px] font-medium transition ${
                isActive ? 'bg-teal-50 text-teal-700' : 'text-slate-700 hover:bg-teal-50 hover:text-teal-700'
              }`
            }
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
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
  )
}

export default AdminNavbar
