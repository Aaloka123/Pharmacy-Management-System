import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LuBell } from 'react-icons/lu'
import {
  fetchNotifications,
  fetchUnreadNotificationCount,
  formatNotificationTime,
  markAllNotificationsRead,
  markNotificationRead,
  type NotificationDto,
} from '../lib/notificationApi'
import { resolveBackendUrl } from '../lib/api'
import { isCartUserLoggedIn } from '../lib/cartStorage'
import { onAuthChange } from '../lib/auth'

const UserNotificationBell = () => {
  const navigate = useNavigate()
  const panelRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationDto[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!isCartUserLoggedIn()) {
      setNotifications([])
      setUnreadCount(0)
      return
    }
    try {
      const [list, count] = await Promise.all([fetchNotifications(), fetchUnreadNotificationCount()])
      setNotifications(list)
      setUnreadCount(count)
    } catch {
      // keep last known state
    }
  }, [])

  useEffect(() => {
    void refresh()
    const interval = window.setInterval(() => void refresh(), 30_000)
    const unsubscribe = onAuthChange(() => void refresh())
    return () => {
      window.clearInterval(interval)
      unsubscribe()
    }
  }, [refresh])

  useEffect(() => {
    if (!open) return
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
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
      setLoading(false)
    }
  }

  const handleSelect = async (notification: NotificationDto) => {
    if (!notification.read) {
      try {
        await markNotificationRead(notification.id)
      } catch {
        // still navigate
      }
    }
    setOpen(false)
    void refresh()
    if (notification.productId != null) {
      navigate(`/productsdetail?id=${notification.productId}`)
    } else {
      navigate('/ordertracking')
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead()
      await refresh()
    } catch {
      // ignore
    }
  }

  if (!isCartUserLoggedIn()) {
    return null
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        aria-expanded={open}
        aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        className="relative flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center text-slate-700 transition duration-200 hover:text-teal-700"
        onClick={() => void handleToggle()}
        title="Notifications"
        type="button"
      >
        <LuBell className="h-5 w-5" strokeWidth={2} />
        {unreadCount > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold tabular-nums text-white shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-bold text-slate-900">Notifications</h2>
            {unreadCount > 0 ? (
              <button
                className="cursor-pointer text-xs font-semibold text-teal-700 hover:text-teal-800 hover:underline"
                onClick={() => void handleMarkAllRead()}
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
                  const imageUrl = notification.productImage
                    ? resolveBackendUrl(notification.productImage)
                    : null
                  return (
                  <li key={notification.id}>
                    <button
                      className={`flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50 ${
                        notification.read ? 'bg-white' : 'bg-teal-50/40'
                      }`}
                      onClick={() => void handleSelect(notification)}
                      type="button"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white">
                        {imageUrl ? (
                          <img
                            alt=""
                            className="h-full w-full object-contain p-0.5"
                            src={imageUrl}
                          />
                        ) : (
                          <span className="text-[10px] text-slate-400">No image</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm leading-snug text-slate-800">{notification.message}</p>
                        <p className="mt-1 text-xs text-slate-500">{formatNotificationTime(notification.createdAt)}</p>
                      </div>
                    </button>
                  </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}

export default UserNotificationBell
