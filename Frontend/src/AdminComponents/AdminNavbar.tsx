import {
  LuBadgeCheck,
  LuLayoutDashboard,
  LuPackage,
  LuSettings,
  LuStar,
  LuStore,
  LuTrendingUp,
  LuUsers,
} from 'react-icons/lu'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import PortalSidebar, { type PortalMenuItem } from '../components/PortalSidebar'
import { api } from '../lib/api'
import { clearAuthSession } from '../lib/auth'
import { PENDING_VENDORS_EVENT, PENDING_VENDORS_URL } from '../lib/adminNotificationApi'

const baseMenuItems: Omit<PortalMenuItem, 'badge'>[] = [
  { label: 'Dashboard', Icon: LuLayoutDashboard, to: '/admindashboard' },
  { label: 'User', Icon: LuUsers, to: '/adminusers' },
  { label: 'Vendor', Icon: LuStore, to: '/adminvendors' },
  { label: 'Approve Vendor', Icon: LuBadgeCheck, to: '/adminapprovevendor' },
  { label: 'Product', Icon: LuPackage, to: '/adminproducts' },
  { label: 'Profit', Icon: LuTrendingUp, to: '/adminprofit' },
  { label: 'Review', Icon: LuStar, to: '/adminreviews' },
  { label: 'Setting', Icon: LuSettings, to: '/adminsettings' },
]

const AdminNavbar = () => {
  const navigate = useNavigate()
  const [pendingVendors, setPendingVendors] = useState(0)

  useEffect(() => {
    let cancelled = false

    const fetchCount = async () => {
      try {
        const { data } = await api.get<unknown[]>(PENDING_VENDORS_URL)
        if (!cancelled) setPendingVendors(data.length)
      } catch {
        // ignore — keep last known count
      }
    }

    fetchCount()
    const interval = window.setInterval(fetchCount, 30000)
    const handleRefresh = () => fetchCount()
    window.addEventListener(PENDING_VENDORS_EVENT, handleRefresh)

    return () => {
      cancelled = true
      window.clearInterval(interval)
      window.removeEventListener(PENDING_VENDORS_EVENT, handleRefresh)
    }
  }, [])

  const menuItems = useMemo(
    () =>
      baseMenuItems.map((item) => {
        if (item.to !== '/adminapprovevendor' || pendingVendors <= 0) return item
        return { ...item, badge: pendingVendors }
      }),
    [pendingVendors],
  )

  const handleLogout = () => {
    clearAuthSession()
    toast.info('You have been logged out.')
    navigate('/login')
  }

  return (
    <PortalSidebar
      menuId="admin-mobile-nav"
      menuItems={menuItems}
      onLogout={handleLogout}
      settingsPath="/adminsettings"
      subtitle="MedNexus Admin"
    />
  )
}

export default AdminNavbar
