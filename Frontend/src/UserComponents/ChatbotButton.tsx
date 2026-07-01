import { useCallback, useEffect, useRef, useState } from 'react'
import { FiX } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import MessagingPage from '../components/MessagingPage'
import { getAccessToken, getStoredUser, onAuthChange } from '../lib/auth'
import { fetchUnreadMessageCount } from '../lib/messageApi'
import {
  MESSAGE_PANEL_OPEN_EVENT,
  MESSAGES_UNREAD_CHANGED_EVENT,
  type MessagePanelOpenDetail,
  type MessagesUnreadChangedDetail,
} from '../lib/messagePanelEvents'

const GLOW_DURATION_MS = 60_000

const ChatbotButton = () => {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [panelTarget, setPanelTarget] = useState<MessagePanelOpenDetail | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [showGlow, setShowGlow] = useState(false)
  const prevUnreadRef = useRef<number | null>(null)
  const glowTimerRef = useRef<number | null>(null)

  const clearGlowTimer = useCallback(() => {
    if (glowTimerRef.current != null) {
      window.clearTimeout(glowTimerRef.current)
      glowTimerRef.current = null
    }
  }, [])

  const stopGlow = useCallback(() => {
    clearGlowTimer()
    setShowGlow(false)
  }, [clearGlowTimer])

  const startGlow = useCallback(() => {
    clearGlowTimer()
    setShowGlow(true)
    glowTimerRef.current = window.setTimeout(() => {
      setShowGlow(false)
      glowTimerRef.current = null
    }, GLOW_DURATION_MS)
  }, [clearGlowTimer])

  const refreshUnreadCount = useCallback(async () => {
    if (!getAccessToken() || getStoredUser()?.role !== 'USER') {
      setUnreadCount(0)
      return
    }
    try {
      const count = await fetchUnreadMessageCount()
      setUnreadCount(count)
    } catch {
      // keep last known count
    }
  }, [])

  const requireUser = (): boolean => {
    if (!getAccessToken() || getStoredUser()?.role !== 'USER') {
      toast.info('Please log in to message vendors.')
      navigate('/login')
      return false
    }
    return true
  }

  const openPanel = (detail?: MessagePanelOpenDetail) => {
    if (!requireUser()) return
    setPanelTarget(detail ?? null)
    setOpen(true)
  }

  const closePanel = () => {
    setOpen(false)
    setPanelTarget(null)
    void refreshUnreadCount()
  }

  useEffect(() => {
    void refreshUnreadCount()
    const interval = window.setInterval(() => void refreshUnreadCount(), 30_000)
    const unsubscribe = onAuthChange(() => void refreshUnreadCount())
    const onUnreadChanged = (event: Event) => {
      const count = (event as CustomEvent<MessagesUnreadChangedDetail>).detail?.count ?? 0
      setUnreadCount(count)
    }
    window.addEventListener(MESSAGES_UNREAD_CHANGED_EVENT, onUnreadChanged)
    return () => {
      window.clearInterval(interval)
      unsubscribe()
      window.removeEventListener(MESSAGES_UNREAD_CHANGED_EVENT, onUnreadChanged)
    }
  }, [refreshUnreadCount])

  useEffect(() => {
    if (prevUnreadRef.current === null) {
      prevUnreadRef.current = unreadCount
      return
    }

    if (unreadCount === 0) {
      stopGlow()
    } else if (unreadCount > prevUnreadRef.current) {
      startGlow()
    }

    prevUnreadRef.current = unreadCount
  }, [unreadCount, startGlow, stopGlow])

  useEffect(() => () => clearGlowTimer(), [clearGlowTimer])

  useEffect(() => {
    const onOpen = (event: Event) => {
      const detail = (event as CustomEvent<MessagePanelOpenDetail>).detail
      openPanel(detail)
    }
    window.addEventListener(MESSAGE_PANEL_OPEN_EVENT, onOpen)
    return () => window.removeEventListener(MESSAGE_PANEL_OPEN_EVENT, onOpen)
  }, [])

  useEffect(() => {
    if (!open) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  const hasUnread = unreadCount > 0

  return (
    <>
      {!open ? (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="relative flex h-14 w-14 items-center justify-center">
            {showGlow ? (
              <>
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-full shadow-[0_0_10px_2px_rgba(45,212,191,0.35)]"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0.5 rounded-full bg-teal-400/45 chatbot-soft-ping"
                />
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute -inset-0.5 rounded-full bg-teal-400/25 blur animate-pulse"
                />
              </>
            ) : null}
            <button
              aria-label={
                hasUnread
                  ? `Open messages, ${unreadCount} unread`
                  : 'Open chatbot assistance'
              }
              className="relative z-10 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-teal-600 text-white shadow-lg shadow-teal-900/20 transition hover:bg-teal-700"
              onClick={() => openPanel()}
              title="Chatbot assistance"
              type="button"
            >
            <svg
              aria-hidden="true"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M8.625 9.75h6.75M8.625 13.5h4.5m8.856-1.636c.056.52.084 1.044.084 1.568 0 2.035-.422 3.973-1.183 5.73a2.25 2.25 0 0 1-2.086 1.338H5.204a2.25 2.25 0 0 1-2.086-1.338A13.968 13.968 0 0 1 1.935 13.5c0-.524.028-1.048.084-1.568A13.965 13.965 0 0 1 1.935 10.5c0-2.035.422-3.973 1.183-5.73A2.25 2.25 0 0 1 5.204 3.432h13.592a2.25 2.25 0 0 1 2.086 1.338A13.968 13.968 0 0 1 22.065 10.5c0 .524-.028 1.048-.084 1.568Z"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {hasUnread ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-emerald-500 px-1 text-[10px] font-semibold text-white shadow-sm ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            ) : null}
            </button>
          </div>
        </div>
      ) : null}

      {open ? (
        <div className="fixed bottom-6 right-6 z-50 flex h-[min(100dvh-5rem,560px)] w-[min(calc(100vw-2rem),400px)] flex-col overflow-hidden overscroll-contain rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-teal-700 px-4 py-3 text-white">
            <div>
              <p className="text-sm font-semibold">Chatbot</p>
              <p className="text-[11px] text-teal-100">Assistance</p>
            </div>
            <button
              aria-label="Close messages"
              className="cursor-pointer rounded-lg p-1.5 hover:bg-teal-600"
              onClick={closePanel}
              type="button"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>
          <div className="min-h-0 flex-1 overscroll-contain">
            <MessagingPage
              key={`${panelTarget?.vendorId ?? 'all'}-${panelTarget?.conversationId ?? 'new'}`}
              initialConversationId={panelTarget?.conversationId ?? null}
              initialVendorId={panelTarget?.vendorId ?? null}
              layout="panel"
              mode="user"
            />
          </div>
        </div>
      ) : null}
    </>
  )
}

export default ChatbotButton
