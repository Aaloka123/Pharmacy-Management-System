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
import mednexuxLogo from '../assets/Mednexux.png'

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

  return (
    <aside className="sticky top-0 flex h-screen w-64 min-w-64 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-6 shadow-sm">
      <div className="mb-8 flex justify-center">
        <img alt="MedNexus logo" className="h-12 w-auto object-contain" src={mednexuxLogo} />
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
        className="mt-auto flex w-full items-center gap-3 rounded-lg bg-rose-50 px-3 py-2 text-left text-[14px] font-semibold text-rose-700 transition hover:bg-rose-100"
        onClick={() => navigate('/login')}
        type="button"
      >
        <LuLogOut className="h-[18px] w-[18px] shrink-0" />
        Logout
      </button>
    </aside>
  )
}

export default AdminNavbar
