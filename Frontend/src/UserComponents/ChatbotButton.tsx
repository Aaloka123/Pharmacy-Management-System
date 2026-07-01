import { useEffect, useState } from 'react'
import { FiX } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import MessagingPage from '../components/MessagingPage'
import { getAccessToken, getStoredUser } from '../lib/auth'
import {
  MESSAGE_PANEL_OPEN_EVENT,
  type MessagePanelOpenDetail,
} from '../lib/messagePanelEvents'

const ChatbotButton = () => {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [panelTarget, setPanelTarget] = useState<MessagePanelOpenDetail | null>(null)

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
  }

  useEffect(() => {
    const onOpen = (event: Event) => {
      const detail = (event as CustomEvent<MessagePanelOpenDetail>).detail
      openPanel(detail)
    }
    window.addEventListener(MESSAGE_PANEL_OPEN_EVENT, onOpen)
    return () => window.removeEventListener(MESSAGE_PANEL_OPEN_EVENT, onOpen)
  }, [])

  return (
    <>
      {!open ? (
        <button
          aria-label="Open messages"
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-teal-600 text-white shadow-lg shadow-teal-900/20 transition hover:bg-teal-700"
          onClick={() => openPanel()}
          title="Messages"
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
        </button>
      ) : null}

      {open ? (
        <div className="fixed bottom-6 right-6 z-50 flex h-[min(100dvh-5rem,560px)] w-[min(calc(100vw-2rem),400px)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-teal-700 px-4 py-3 text-white">
            <div>
              <p className="text-sm font-semibold">Messages</p>
              <p className="text-[11px] text-teal-100">Chat with vendors</p>
            </div>
            <button
              aria-label="Close messages"
              className="rounded-lg p-1.5 hover:bg-teal-600"
              onClick={closePanel}
              type="button"
            >
              <FiX className="h-4 w-4" />
            </button>
          </div>
          <div className="min-h-0 flex-1">
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
