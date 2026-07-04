import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  LuBell,
  LuMessageSquareText,
  LuPackage,
  LuShoppingBag,
  LuStar,
} from 'react-icons/lu'
import {
  countUnreadVendorNotifications,
  fetchVendorNotifications,
  formatNotificationAgo,
  markAllVendorNotificationsSeen,
  markVendorNotificationSeen,
  VENDOR_BADGES_REFRESH_EVENT,
  type VendorNotification,
  type VendorNotificationKind,
} from '../lib/vendorNotificationApi'

type VendorNotificationBellProps = {
  buttonClassName?: string
}

type PanelPosition = {
  top: number
  right: number
}

const iconForKind = (kind: VendorNotificationKind) => {
  switch (kind) {
    case 'order':
      return LuShoppingBag
    case 'message':
      return LuMessageSquareText
    case 'review':
      return LuStar
    default:
      return LuPackage
  }
}

const accentForKind = (kind: VendorNotificationKind) => {
  switch (kind) {
    case 'order':
      return 'bg-emerald-50 text-emerald-700'
    case 'message':
      return 'bg-sky-50 text-sky-700'
    case 'review':
      return 'bg-amber-50 text-amber-700'
    case 'expired':
      return 'bg-rose-50 text-rose-700'
    default:
      return 'bg-orange-50 text-orange-700'
  }
}

const VendorNotificationBell = ({
  buttonClassName = 'relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:text-teal-700',
}: VendorNotificationBellProps) => {
  const navigate = useNavigate()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<VendorNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)
  const [panelPosition, setPanelPosition] = useState<PanelPosition | null>(null)

  const refresh = useCallback(async () => {
    try {
      const list = await fetchVendorNotifications()
      setNotifications(list)
      setUnreadCount(countUnreadVendorNotifications(list))
    } catch {
      setNotifications([])
      setUnreadCount(0)
    }
  }, [])

  const updatePanelPosition = useCallback(() => {
    const button = buttonRef.current
    if (!button) return
    const rect = button.getBoundingClientRect()
    setPanelPosition({
      top: rect.bottom + 8,
      right: Math.max(8, window.innerWidth - rect.right),
    })
  }, [])

  useEffect(() => {
    void refresh()
    const interval = window.setInterval(() => void refresh(), 30_000)
    const handleRefresh = () => void refresh()
    window.addEventListener(VENDOR_BADGES_REFRESH_EVENT, handleRefresh)
    return () => {
      window.clearInterval(interval)
      window.removeEventListener(VENDOR_BADGES_REFRESH_EVENT, handleRefresh)
    }
  }, [refresh])

  useEffect(() => {
    if (!open) return
    updatePanelPosition()
    const handleScrollOrResize = () => updatePanelPosition()
    window.addEventListener('scroll', handleScrollOrResize, true)
    window.addEventListener('resize', handleScrollOrResize)
    return () => {
      window.removeEventListener('scroll', handleScrollOrResize, true)
      window.removeEventListener('resize', handleScrollOrResize)
    }
  }, [open, updatePanelPosition])

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (buttonRef.current?.contains(target) || panelRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const handleToggle = async () => {
    const next = !open
    setOpen(next)
    if (next) {
      setLoading(true)
      await refresh()
      updatePanelPosition()
      setLoading(false)
    }
  }

  const handleSelect = (notification: VendorNotification) => {
    markVendorNotificationSeen(notification)
    setOpen(false)
    void refresh()
    navigate(notification.path)
  }

  const handleMarkAllRead = () => {
    markAllVendorNotificationsSeen(notifications)
    void refresh()
  }

  const panel =
    open && panelPosition
      ? createPortal(
          <div
            ref={panelRef}
            className="fixed z-[9999] w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
            style={{ top: panelPosition.top, right: panelPosition.right }}
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h2 className="text-sm font-bold text-slate-900">Notifications</h2>
              {unreadCount > 0 ? (
                <button
                  className="cursor-pointer text-xs font-semibold text-teal-700 hover:text-teal-800 hover:underline"
                  onClick={handleMarkAllRead}
                  type="button"
                >
                  Mark all read
                </button>
              ) : null}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <p className="px-4 py-8 text-center text-sm text-slate-500">Loading…</p>
              ) : notifications.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-slate-500">No notifications yet.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {notifications.map((notification) => {
                    const Icon = iconForKind(notification.kind)
                    return (
                      <li key={notification.id}>
                        <button
                          className={`flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50 ${
                            notification.unread ? 'bg-teal-50/40' : 'bg-white'
                          }`}
                          onClick={() => handleSelect(notification)}
                          type="button"
                        >
                          <div
                            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-slate-200 ${accentForKind(notification.kind)}`}
                          >
                            <Icon className="h-5 w-5" strokeWidth={2} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm leading-snug text-slate-800">{notification.message}</p>
                            <p className="mt-1 text-xs text-slate-400">
                              {formatNotificationAgo(notification.createdAt)}
                            </p>
                          </div>
                        </button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>,
          document.body,
        )
      : null

  return (
    <>
      <button
        ref={buttonRef}
        aria-expanded={open}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        className={buttonClassName}
        onClick={() => void handleToggle()}
        title="Notifications"
        type="button"
      >
        <LuBell className="h-5 w-5" strokeWidth={2} />
        {unreadCount > 0 && notifications.some((notification) => notification.unread) ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold tabular-nums text-white shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>
      {panel}
    </>
  )
}

export default VendorNotificationBell
