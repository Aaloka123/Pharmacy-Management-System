import {
  LuLayoutDashboard,
  LuMessageSquareText,
  LuPackage,
  LuReceiptText,
  LuSettings,
  LuShoppingBag,
  LuStar,
} from 'react-icons/lu'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import PortalSidebar, { type PortalMenuItem } from '../components/PortalSidebar'
import { clearStoredUser } from '../lib/auth'

const menuItems: PortalMenuItem[] = [
  { label: 'Dashboard', Icon: LuLayoutDashboard, to: '/vendordashboard' },
  { label: 'Message', Icon: LuMessageSquareText, to: '/vendormessage', badge: 1 },
  { label: 'Product', Icon: LuPackage, to: '/vendorproduct' },
  { label: 'Order', Icon: LuShoppingBag, to: '/vendororder' },
  { label: 'Review', Icon: LuStar, to: '/vendorreview' },
  { label: 'Bills', Icon: LuReceiptText, to: '/vendorbills' },
  { label: 'Setting', Icon: LuSettings, to: '/vendorsetting' },
]

const Navbar = () => {
  const navigate = useNavigate()

  const handleLogout = () => {
    clearStoredUser()
    toast.error('You have been logged out.')
    navigate('/vendorlogin')
  }

  return (
    <PortalSidebar
      menuId="vendor-mobile-nav"
      menuItems={menuItems}
      onLogout={handleLogout}
      settingsPath="/vendorsetting"
      subtitle="MedNexus Vendor"
    />
  )
}

export default Navbar
