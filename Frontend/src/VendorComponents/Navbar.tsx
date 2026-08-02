import { useMemo } from 'react'
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
import { useVendorNavBadges } from '../lib/vendorNavBadges'

const Navbar = () => {
  const navigate = useNavigate()
  const badges = useVendorNavBadges()

  const menuItems = useMemo<PortalMenuItem[]>(
    () => [
      { label: 'Dashboard', Icon: LuLayoutDashboard, to: '/vendordashboard' },
      { label: 'Message', Icon: LuMessageSquareText, to: '/vendormessage', badge: badges.message },
      { label: 'Product', Icon: LuPackage, to: '/vendorproduct', badge: badges.product },
      { label: 'Order', Icon: LuShoppingBag, to: '/vendororder', badge: badges.order },
      { label: 'Review', Icon: LuStar, to: '/vendorreview', badge: badges.review },
      { label: 'Bills', Icon: LuReceiptText, to: '/vendorbills' },
      { label: 'Setting', Icon: LuSettings, to: '/vendorsetting' },
    ],
    [badges.message, badges.product, badges.order, badges.review],
  )

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
      subtitle="MedNexus"
    />
  )
}

export default Navbar
