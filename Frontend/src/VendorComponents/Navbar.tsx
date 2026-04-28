import {
  LuLayoutDashboard,
  LuShoppingBag,
  LuStar,
  LuPackage,
  LuMessageSquareText,
  LuReceiptText,
  LuSettings,
  LuLogOut,
} from 'react-icons/lu';
import { NavLink, useNavigate } from 'react-router-dom';

const menuItems = [
  { label: 'Dashboard', Icon: LuLayoutDashboard, to: '/vendordashboard' },
  { label: 'Message', Icon: LuMessageSquareText, to: '/vendormessage', notificationCount: 1 },
  { label: 'Product', Icon: LuPackage, to: '/vendorproduct' },
  { label: 'Order', Icon: LuShoppingBag, to: '/vendororder' },
  { label: 'Review', Icon: LuStar, to: '/vendorreview' },
  { label: 'Bills', Icon: LuReceiptText, to: '/vendorbills' },
  { label: 'Setting', Icon: LuSettings, to: '/vendorsetting' },
];

const Navbar = () => {
  const navigate = useNavigate();

  return (
    <aside className="flex h-screen w-64 min-w-64 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-6 shadow-sm">
      <div className="mb-8 text-center text-2xl font-bold tracking-tight text-slate-900">
        Med<span className="text-teal-700">Nexus</span>
      </div>

      <nav className="flex flex-col gap-2">
        {menuItems.map(({ label, Icon, to, notificationCount }) => (
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
            {notificationCount ? (
              <span className="ml-auto inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold text-white">
                {notificationCount}
              </span>
            ) : null}
          </NavLink>
        ))}
      </nav>

      <button
        className="mt-auto flex w-full items-center gap-3 rounded-lg bg-rose-50 px-3 py-2 text-left text-[14px] font-semibold text-rose-700 transition hover:bg-rose-100"
        onClick={() => navigate('/vendorlogin')}
        type="button"
      >
        <LuLogOut className="h-[18px] w-[18px] shrink-0" />
        Logout
      </button>
    </aside>
  );
};

export default Navbar;