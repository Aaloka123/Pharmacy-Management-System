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
import { toast } from 'react-toastify';
import mednexuxLogo from '../assets/Mednexux.png';
import { clearStoredUser } from '../lib/auth';

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

  const handleLogout = () => {
    clearStoredUser();
    toast.error('You have been logged out.');
    navigate('/vendorlogin');
  };

  return (
    <aside className="sticky top-0 flex h-screen w-[280px] min-w-[280px] shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-6 shadow-sm">
      <div className="mb-8 flex flex-col items-center justify-center">
        <img alt="MedNexus logo" className="h-12 w-auto object-contain" src={mednexuxLogo} />
        <p className="mt-6 text-center text-xs font-medium text-slate-600">MedNexus Vendor</p>
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
        className="mt-auto flex w-full cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-[14px] font-semibold text-slate-700 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700"
        onClick={handleLogout}
        type="button"
      >
        <LuLogOut className="h-[18px] w-[18px] shrink-0" />
        Logout
      </button>
    </aside>
  );
};

export default Navbar;