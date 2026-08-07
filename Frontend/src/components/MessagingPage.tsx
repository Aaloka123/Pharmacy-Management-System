import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { FiArrowLeft, FiCornerUpLeft, FiImage, FiMoreHorizontal, FiPaperclip, FiSend, FiTrash2, FiX } from 'react-icons/fi'
import { HiOutlineMagnifyingGlass } from 'react-icons/hi2'
import { LuBan, LuBell, LuBellOff, LuMailOpen, LuPin, LuPinOff } from 'react-icons/lu'
import { toast } from 'react-toastify'
import mednexuxLogo from '../assets/Mednexux.png'
import { resolveMediaUrl, resolveProfileImageUrl } from '../lib/api'
import { getStoredUser } from '../lib/auth'
import {
  createChatClient,
  sendChatMessage,
  subscribeToConversation,
} from '../lib/chatSocket'
import {
  createConversation,
  deleteMessageForEveryone,
  deleteMessageForMe,
  fetchConversations,
  fetchMessages,
  markConversationRead,
  markConversationUnread,
  updateConversationSettings,
  type ChatMessageDto,
  type ConversationDto,
  uploadMessageAttachment,
  sendMessageRest,
} from '../lib/messageApi'
import { refreshVendorNavBadges } from '../lib/vendorNavBadges'
import { notifyMessagesUnreadChanged } from '../lib/messagePanelEvents'
import { sendChatbotMessage, fetchChatbotMessages } from '../lib/chatbotApi'
import type { ChatbotProductCard } from '../lib/chatbotApi'
import type { Client, StompSubscription } from '@stomp/stompjs'

type MessagingPageProps = {
  mode: 'user' | 'vendor'
  initialVendorId?: number | null
  initialConversationId?: number | null
  layout?: 'page' | 'panel'
}

const ACCEPTED_FILES = 'image/jpeg,image/png,image/webp,image/gif,application/pdf'

function peerInitial(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return '?'
  const parts = trimmed.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return trimmed.slice(0, 2).toUpperCase()
}

function formatMessageTime(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function MessageAvatar({
  imageUrl,
  name,
  side,
}: {
  imageUrl: string | null
  name: string
  side: 'left' | 'right'
}) {
  const resolved = resolveProfileImageUrl(imageUrl)
  return (
    <div
      className={`flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 ${
        resolved ? 'bg-white' : 'bg-teal-700 text-[10px] font-bold text-white'
      } ${side === 'left' ? 'mr-2' : 'ml-2'}`}
      title={name}
    >
      {resolved ? (
        <img alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" src={resolved} />
      ) : (
        peerInitial(name)
      )}
    </div>
  )
}

const getChatbotWelcome = (mode: 'user' | 'vendor') =>
  mode === 'vendor'
    ? 'Hi! I can help with pending orders, expired products, low stock, and customer reviews.'
    : 'Hi! Tell me how you feel or ask about medicines. I can suggest common options and show products available on MedNexus.'

type ChatbotMessage = {
  id: number
  role: 'assistant' | 'user'
  body: string
  createdAt: string
  imageUrl?: string
  products?: ChatbotProductCard[]
}

function createWelcomeChatbotMessage(mode: 'user' | 'vendor'): ChatbotMessage {
  return {
    id: 0,
    role: 'assistant',
    body: getChatbotWelcome(mode),
    createdAt: new Date().toISOString(),
  }
}

function ChatbotAvatar({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const shellClass =
    size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-11 w-11' : 'h-10 w-10'
  const logoClass =
    size === 'sm' ? 'h-5 w-auto max-w-full' : size === 'lg' ? 'h-7 w-auto max-w-full' : 'h-6 w-auto max-w-full'

  return (
    <span
      className={`flex ${shellClass} shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white p-1`}
    >
      <img alt="MedNexus assistant" className={`${logoClass} object-contain`} src={mednexuxLogo} />
    </span>
  )
}

function ChatbotListItem({
  active,
  onClick,
  preview,
}: {
  active: boolean
  onClick: () => void
  preview: string
}) {
  return (
    <button
      aria-selected={active}
      className={`flex w-full shrink-0 cursor-pointer items-center gap-3 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 ${
        active ? 'bg-teal-50/70 hover:bg-teal-50/70' : 'bg-white'
      }`}
      onClick={onClick}
      type="button"
    >
      <ChatbotAvatar size="lg" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-slate-900">Chatbot</span>
          <span className="shrink-0 text-[11px] font-medium text-violet-600">Assistant</span>
        </div>
        <p className="truncate text-xs text-slate-500">{preview}</p>
      </div>
    </button>
  )
}

function sortConversations(list: ConversationDto[]): ConversationDto[] {
  return [...list].sort((left, right) => {
    if (left.pinned !== right.pinned) {
      return left.pinned ? -1 : 1
    }
    const leftTime = left.lastMessageAt ? new Date(left.lastMessageAt).getTime() : 0
    const rightTime = right.lastMessageAt ? new Date(right.lastMessageAt).getTime() : 0
    return rightTime - leftTime
  })
}

function countVisibleUnread(conversations: ConversationDto[]): number {
  return conversations.reduce(
    (sum, conversation) => sum + (conversation.muted ? 0 : conversation.unreadCount),
    0,
  )
}

const MessagingPage = ({ mode, initialVendorId, initialConversationId, layout = 'page' }: MessagingPageProps) => {
  const isPanel = layout === 'panel'
  const selfSenderType = mode === 'vendor' ? 'VENDOR' : 'USER'
  const [conversations, setConversations] = useState<ConversationDto[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [chatbotSelected, setChatbotSelected] = useState(false)
  const [chatbotMessages, setChatbotMessages] = useState<ChatbotMessage[]>(() => [createWelcomeChatbotMessage(mode)])
  const [chatbotDraft, setChatbotDraft] = useState('')
  const [chatbotSending, setChatbotSending] = useState(false)
  const [chatbotLoading, setChatbotLoading] = useState(true)
  const [messages, setMessages] = useState<ChatMessageDto[]>([])
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState('')
  const [replyTo, setReplyTo] = useState<ChatMessageDto | null>(null)
  const [loadingList, setLoadingList] = useState(true)
  const [loadingThread, setLoadingThread] = useState(false)
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [messageMenu, setMessageMenu] = useState<{
    message: ChatMessageDto
    x: number
    y: number
  } | null>(null)
  const [conversationMenu, setConversationMenu] = useState<{
    conversationId: number
    x: number
    y: number
  } | null>(null)
  const [pendingAttachment, setPendingAttachment] = useState<{
    url: string
    fileName: string
    mimeType: string
    kind: 'image' | 'pdf' | 'file'
  } | null>(null)

  const messageListRef = useRef<HTMLDivElement>(null)
  const chatbotMessageListRef = useRef<HTMLDivElement>(null)
  const conversationListRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const stompClientRef = useRef<Client | null>(null)
  const subscriptionRef = useRef<StompSubscription | null>(null)
  const initialVendorHandled = useRef(false)
  const initialConversationHandled = useRef(false)

  const selectedConversation = useMemo(
    () => conversations.find((conversation) => conversation.id === selectedId) ?? null,
    [conversations, selectedId],
  )

  const filteredConversations = useMemo(() => {
    const query = search.trim().toLowerCase()
    let list = conversations
    if (query) {
      list = list.filter((conversation) => conversation.peerName.toLowerCase().includes(query))
    }
    return sortConversations(list)
  }, [conversations, search])

  const conversationMenuTarget = useMemo(
    () =>
      conversationMenu
        ? (conversations.find((conversation) => conversation.id === conversationMenu.conversationId) ?? null)
        : null,
    [conversationMenu, conversations],
  )

  const scrollToBottom = useCallback(() => {
    const el = messageListRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [])

  const scrollChatbotToBottom = useCallback(() => {
    const el = chatbotMessageListRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [])

  const loadChatbotHistory = useCallback(async () => {
    setChatbotLoading(true)
    try {
      const stored = await fetchChatbotMessages()
      if (stored.length === 0) {
        setChatbotMessages([createWelcomeChatbotMessage(mode)])
      } else {
        setChatbotMessages(
          stored.map((message) => ({
            id: message.id,
            role: message.role,
            body: message.body,
            createdAt: message.createdAt,
            products: message.products,
          })),
        )
      }
    } catch {
      setChatbotMessages([createWelcomeChatbotMessage(mode)])
    } finally {
      setChatbotLoading(false)
    }
  }, [mode])

  const chatbotPreview = useMemo(() => {
    const lastStored = [...chatbotMessages].reverse().find((message) => message.id !== 0)
    return lastStored?.body ?? getChatbotWelcome(mode)
  }, [chatbotMessages, mode])

  const loadConversations = useCallback(async () => {
    setLoadingList(true)
    try {
      const list = await fetchConversations()
      setConversations(list)
    } catch {
      toast.error('Could not load conversations.')
    } finally {
      setLoadingList(false)
    }
  }, [])

  const openConversation = useCallback(
    async (conversationId: number) => {
      setChatbotSelected(false)
      setSelectedId(conversationId)
      setReplyTo(null)
      setMessageMenu(null)
      setConversationMenu(null)
      setPendingAttachment(null)
      setLoadingThread(true)
      try {
        const thread = await fetchMessages(conversationId)
        setMessages(thread)
        await markConversationRead(conversationId)
        setConversations((prev) =>
          prev.map((conversation) =>
            conversation.id === conversationId ? { ...conversation, unreadCount: 0 } : conversation,
          ),
        )
        if (mode === 'vendor') {
          refreshVendorNavBadges()
        }
      } catch {
        toast.error('Could not load messages.')
        setMessages([])
      } finally {
        setLoadingThread(false)
        window.setTimeout(scrollToBottom, 50)
      }
    },
    [mode, scrollToBottom],
  )

  const openChatbot = useCallback(() => {
    setChatbotSelected(true)
    setSelectedId(null)
    setReplyTo(null)
    setMessageMenu(null)
    setPendingAttachment(null)
    setMessages([])
    setDraft('')
    window.setTimeout(scrollChatbotToBottom, 50)
  }, [scrollChatbotToBottom])

  useEffect(() => {
    void loadChatbotHistory()
  }, [loadChatbotHistory])

  const handleChatbotSend = async () => {
    const text = chatbotDraft.trim()
    if (!text || chatbotSending) return

    const userMessage: ChatbotMessage = {
      id: Date.now(),
      role: 'user',
      body: text,
      createdAt: new Date().toISOString(),
    }

    setChatbotMessages((prev) => [...prev, userMessage])
    setChatbotDraft('')
    setChatbotSending(true)
    window.setTimeout(scrollChatbotToBottom, 50)

    try {
      const response = await sendChatbotMessage(text)
      setChatbotMessages((prev) => [
        ...prev.filter((message) => message.id !== userMessage.id),
        {
          id: response.userMessageId,
          role: 'user',
          body: text,
          createdAt: response.userCreatedAt,
        },
        {
          id: response.assistantMessageId,
          role: 'assistant',
          body: response.reply,
          createdAt: response.assistantCreatedAt,
          products: mode === 'user' ? response.products : undefined,
        },
      ])
      window.setTimeout(scrollChatbotToBottom, 50)
    } catch {
      toast.error('AI assistant is unavailable. Make sure Ollama is running with llama3.2:3b.')
      setChatbotMessages((prev) => [
        ...prev.filter((message) => message.id !== userMessage.id),
        {
          id: Date.now() + 1,
          role: 'assistant',
          body: 'Sorry, I could not reach the local AI service. Please make sure Ollama is running and try again.',
          createdAt: new Date().toISOString(),
        },
      ])
      window.setTimeout(scrollChatbotToBottom, 50)
    } finally {
      setChatbotSending(false)
    }
  }

  useEffect(() => {
    void loadConversations()
  }, [loadConversations])

  useEffect(() => {
    if (mode !== 'user') return
    notifyMessagesUnreadChanged(countVisibleUnread(conversations))
  }, [conversations, mode])

  useEffect(() => {
    if (!isPanel) return undefined

    const lockScrollChain = (element: HTMLElement) => {
      const onWheel = (event: WheelEvent) => {
        const { scrollTop, scrollHeight, clientHeight } = element
        const maxScroll = scrollHeight - clientHeight
        if (maxScroll <= 0) {
          event.preventDefault()
          return
        }
        if ((scrollTop <= 0 && event.deltaY < 0) || (scrollTop >= maxScroll - 1 && event.deltaY > 0)) {
          event.preventDefault()
        }
      }
      element.addEventListener('wheel', onWheel, { passive: false })
      return () => element.removeEventListener('wheel', onWheel)
    }

    const cleanups = [messageListRef.current, chatbotMessageListRef.current, conversationListRef.current]
      .filter((element): element is HTMLDivElement => element != null)
      .map(lockScrollChain)

    return () => {
      cleanups.forEach((cleanup) => cleanup())
    }
  }, [isPanel, messages.length, chatbotMessages.length, filteredConversations.length, selectedId, chatbotSelected])

  useEffect(() => {
    if (initialConversationId == null || initialConversationHandled.current) {
      return
    }
    initialConversationHandled.current = true
    void (async () => {
      try {
        const list = await fetchConversations()
        setConversations(list)
        await openConversation(initialConversationId)
      } catch {
        toast.error('Could not open conversation.')
      }
    })()
  }, [initialConversationId, openConversation])

  useEffect(() => {
    if (
      mode !== 'user' ||
      initialVendorId == null ||
      initialConversationId != null ||
      initialVendorHandled.current
    ) {
      return
    }
    initialVendorHandled.current = true
    void (async () => {
      try {
        const conversation = await createConversation(initialVendorId)
        setConversations((prev) => {
          const exists = prev.some((item) => item.id === conversation.id)
          if (exists) {
            return prev.map((item) => (item.id === conversation.id ? conversation : item))
          }
          return [conversation, ...prev]
        })
        await openConversation(conversation.id)
      } catch {
        toast.error('Could not start conversation with this vendor.')
      }
    })()
  }, [initialConversationId, initialVendorId, mode, openConversation])

  useEffect(() => {
    const client = createChatClient()
    stompClientRef.current = client
    client.activate()
    return () => {
      subscriptionRef.current?.unsubscribe()
      subscriptionRef.current = null
      client.deactivate()
      stompClientRef.current = null
    }
  }, [])

  useEffect(() => {
    subscriptionRef.current?.unsubscribe()
    subscriptionRef.current = null
    if (selectedId == null) return undefined

    const client = stompClientRef.current
    if (!client) return undefined

    const handleFrame = (frame: { body: string }) => {
      try {
        const payload = JSON.parse(frame.body) as
          | ChatMessageDto
          | { eventType: 'DELETE_FOR_EVERYONE'; message: ChatMessageDto }

        if ('eventType' in payload && payload.eventType === 'DELETE_FOR_EVERYONE') {
          const updated = payload.message
          setMessages((prev) => prev.map((message) => (message.id === updated.id ? updated : message)))
          setConversations((prev) =>
            prev.map((conversation) =>
              conversation.id === updated.conversationId
                ? {
                    ...conversation,
                    lastMessagePreview: updated.deleted ? 'Message deleted' : conversation.lastMessagePreview,
                  }
                : conversation,
            ),
          )
          return
        }

        const incoming = payload as ChatMessageDto
        setMessages((prev) => {
          if (prev.some((message) => message.id === incoming.id)) {
            return prev
          }
          return [...prev, incoming]
        })
        setConversations((prev) =>
          prev.map((conversation) =>
            conversation.id === incoming.conversationId
              ? {
                  ...conversation,
                  lastMessagePreview:
                    incoming.body ?? (incoming.attachmentKind === 'pdf' ? 'PDF document' : 'Photo'),
                  lastMessageAt: incoming.createdAt,
                  unreadCount:
                    conversation.id === selectedId || incoming.senderType === selfSenderType
                      ? conversation.unreadCount
                      : conversation.unreadCount + 1,
                }
              : conversation,
          ),
        )
        if (incoming.senderType !== selfSenderType && incoming.conversationId === selectedId) {
          void markConversationRead(selectedId)
        }
        window.setTimeout(scrollToBottom, 50)
      } catch {
        // ignore malformed payloads
      }
    }

    const attachSubscription = () => {
      subscriptionRef.current?.unsubscribe()
      subscriptionRef.current = subscribeToConversation(client, selectedId, handleFrame)
    }

    if (client.connected) {
      attachSubscription()
    }

    const previousOnConnect = client.onConnect
    client.onConnect = (frame) => {
      previousOnConnect?.(frame)
      attachSubscription()
    }

    return () => {
      subscriptionRef.current?.unsubscribe()
      subscriptionRef.current = null
      client.onConnect = previousOnConnect
    }
  }, [scrollToBottom, selectedId, selfSenderType])

  const handleSend = async () => {
    if (selectedId == null || sending || selectedConversation?.blocked) return
    const text = draft.trim()
    if (!text && !pendingAttachment) return

    const payload = {
      body: text || null,
      attachmentUrl: pendingAttachment?.url ?? null,
      attachmentName: pendingAttachment?.fileName ?? null,
      attachmentMimeType: pendingAttachment?.mimeType ?? null,
      replyToMessageId: replyTo?.id ?? null,
    }

    setSending(true)
    try {
      const client = stompClientRef.current
      if (client?.connected) {
        sendChatMessage(client, selectedId, payload)
      } else {
        const saved = await sendMessageRest(selectedId, payload)
        setMessages((prev) => [...prev, saved])
      }
      setDraft('')
      setReplyTo(null)
      setPendingAttachment(null)
      window.setTimeout(scrollToBottom, 50)
    } catch {
      toast.error('Could not send message.')
    } finally {
      setSending(false)
    }
  }

  const handleFilePick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file || selectedId == null) return

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      toast.error('Only images and PDF files are allowed.')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be 10 MB or smaller.')
      return
    }

    setUploading(true)
    try {
      const uploaded = await uploadMessageAttachment(selectedId, file)
      setPendingAttachment({
        url: uploaded.url,
        fileName: uploaded.fileName,
        mimeType: uploaded.mimeType,
        kind: uploaded.kind,
      })
    } catch {
      toast.error('Could not upload file.')
    } finally {
      setUploading(false)
    }
  }

  const replyPreview = (message: ChatMessageDto) => {
    if (message.deleted) return 'Message deleted'
    if (message.body) return message.body
    if (message.attachmentKind === 'pdf') return 'PDF document'
    if (message.attachmentKind === 'image') return 'Photo'
    return 'Attachment'
  }

  const selfId = getStoredUser()?.id
  const selfUser = getStoredUser()
  const peerDisplayName = selectedConversation?.peerName ?? (mode === 'vendor' ? 'Customer' : 'Vendor')
  const peerDisplayImage = selectedConversation?.peerProfileImage ?? null
  const isConversationBlocked = selectedConversation?.blocked ?? false

  const canReplyToMessage = useCallback(
    (message: ChatMessageDto) => {
      if (message.deleted) return false
      const fromSelf = message.senderType === selfSenderType && message.senderId === selfId
      return !fromSelf && (mode === 'user' || mode === 'vendor')
    },
    [mode, selfId, selfSenderType],
  )

  const isOwnMessage = useCallback(
    (message: ChatMessageDto) =>
      message.senderType === selfSenderType && message.senderId === selfId,
    [selfId, selfSenderType],
  )

  const handleDeleteForMe = async (message: ChatMessageDto) => {
    if (selectedId == null) return
    setMessageMenu(null)
    try {
      await deleteMessageForMe(selectedId, message.id)
      setMessages((prev) => prev.filter((item) => item.id !== message.id))
      if (replyTo?.id === message.id) {
        setReplyTo(null)
      }
    } catch {
      toast.error('Could not delete message for yourself.')
    }
  }

  const handleDeleteForEveryone = async (message: ChatMessageDto) => {
    if (selectedId == null) return
    setMessageMenu(null)
    try {
      await deleteMessageForEveryone(selectedId, message.id)
      setMessages((prev) =>
        prev.map((item) =>
          item.id === message.id
            ? {
                ...item,
                deleted: true,
                body: null,
                attachmentUrl: null,
                attachmentName: null,
                attachmentMimeType: null,
                attachmentKind: null,
              }
            : item,
        ),
      )
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === selectedId
            ? { ...conversation, lastMessagePreview: 'Message deleted' }
            : conversation,
        ),
      )
      if (replyTo?.id === message.id) {
        setReplyTo(null)
      }
    } catch {
      toast.error('Could not delete message for everyone.')
    }
  }

  const openConversationMenu = (
    conversationId: number,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation()
    if (conversationMenu?.conversationId === conversationId) {
      closeConversationMenu()
      return
    }
    const rect = event.currentTarget.getBoundingClientRect()
    const menuWidth = 220
    setConversationMenu({
      conversationId,
      x: Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8)),
      y: rect.bottom + 6,
    })
  }

  const closeConversationMenu = () => setConversationMenu(null)

  const handleMarkConversationUnread = async (conversationId: number) => {
    closeConversationMenu()
    try {
      await markConversationUnread(conversationId)
      const list = await fetchConversations()
      setConversations(list)
      if (mode === 'vendor') {
        refreshVendorNavBadges()
      } else {
        notifyMessagesUnreadChanged(countVisibleUnread(list))
      }
    } catch {
      toast.error('Could not mark conversation as unread.')
    }
  }

  const handleTogglePinConversation = async (conversationId: number) => {
    const conversation = conversations.find((item) => item.id === conversationId)
    if (!conversation) return
    closeConversationMenu()
    try {
      const updated = await updateConversationSettings(conversationId, { pinned: !conversation.pinned })
      setConversations((prev) => sortConversations(prev.map((item) => (item.id === conversationId ? updated : item))))
    } catch {
      toast.error('Could not update conversation.')
    }
  }

  const handleToggleMuteConversation = async (conversationId: number) => {
    const conversation = conversations.find((item) => item.id === conversationId)
    if (!conversation) return
    closeConversationMenu()
    try {
      const updated = await updateConversationSettings(conversationId, { muted: !conversation.muted })
      setConversations((prev) => prev.map((item) => (item.id === conversationId ? updated : item)))
      if (mode === 'vendor') {
        refreshVendorNavBadges()
      } else {
        notifyMessagesUnreadChanged(
          countVisibleUnread(
            conversations.map((item) => (item.id === conversationId ? updated : item)),
          ),
        )
      }
    } catch {
      toast.error('Could not update conversation.')
    }
  }

  const handleDeleteConversation = async (conversationId: number) => {
    const conversation = conversations.find((item) => item.id === conversationId)
    const peerName = conversation?.peerName ?? (mode === 'vendor' ? 'this customer' : 'this vendor')
    closeConversationMenu()

    const confirmed = window.confirm(`Delete conversation with ${peerName}? It will be removed from your list.`)
    if (!confirmed) return

    try {
      await updateConversationSettings(conversationId, { hidden: true })
      const nextConversations = conversations.filter((item) => item.id !== conversationId)
      setConversations(nextConversations)
      if (selectedId === conversationId) {
        setSelectedId(null)
        setMessages([])
      }
      if (mode === 'vendor') {
        refreshVendorNavBadges()
      } else {
        notifyMessagesUnreadChanged(countVisibleUnread(nextConversations))
      }
    } catch {
      toast.error('Could not delete conversation.')
    }
  }

  const handleBlockConversation = async (conversationId: number) => {
    const conversation = conversations.find((item) => item.id === conversationId)
    if (!conversation) return
    closeConversationMenu()
    try {
      const updated = await updateConversationSettings(conversationId, { blocked: !conversation.blocked })
      setConversations((prev) => prev.map((item) => (item.id === conversationId ? updated : item)))
    } catch {
      toast.error('Could not update conversation.')
    }
  }

  useEffect(() => {
    if (!messageMenu) return undefined
    const closeMenu = () => setMessageMenu(null)
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu()
    }
    window.addEventListener('click', closeMenu)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('scroll', closeMenu, true)
    return () => {
      window.removeEventListener('click', closeMenu)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', closeMenu, true)
    }
  }, [messageMenu])

  useEffect(() => {
    if (!conversationMenu) return undefined
    const closeMenu = () => closeConversationMenu()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu()
    }
    window.addEventListener('click', closeMenu)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('scroll', closeMenu, true)
    return () => {
      window.removeEventListener('click', closeMenu)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', closeMenu, true)
    }
  }, [conversationMenu])

  const showConversationList = !isPanel || (!selectedId && !chatbotSelected)
  const showConversationThread = !isPanel || selectedId != null || chatbotSelected

  const backToList = () => {
    setChatbotSelected(false)
    setSelectedId(null)
    setMessages([])
    setReplyTo(null)
    setMessageMenu(null)
    setConversationMenu(null)
    setPendingAttachment(null)
  }

  return (
    <div
      className={
        isPanel
          ? 'flex h-full min-h-0 flex-col overflow-hidden overscroll-contain bg-white'
          : 'flex min-h-[calc(100dvh-4rem)] flex-col bg-slate-50 md:min-h-[calc(100dvh-5rem)]'
      }
    >
      <div
        className={
          isPanel
            ? 'flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-white'
            : 'mx-auto flex w-full max-w-6xl flex-1 flex-col overflow-hidden border-x border-slate-200 bg-white shadow-sm lg:my-4 lg:min-h-[640px] lg:max-h-[calc(100dvh-6rem)] lg:rounded-xl lg:border'
        }
      >
        <div
          className={`grid min-h-0 flex-1 ${
            isPanel ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-[320px_1fr]'
          }`}
        >
          {showConversationList ? (
          <aside className="flex min-h-0 flex-col border-b border-slate-200 lg:border-b-0 lg:border-r">
            <div className="border-b border-slate-200 px-4 py-3">
              {!isPanel ? (
                <>
                  <h1 className="text-lg font-semibold text-slate-900">Messages</h1>
                  <p className="text-xs text-slate-500">
                    {mode === 'user' ? 'Chat with pharmacy vendors' : 'Reply to customer messages'}
                  </p>
                </>
              ) : null}
              <div className={`relative ${isPanel ? 'mt-0' : 'mt-3'}`}>
                <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className={`w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-teal-500 ${isPanel ? '' : ''}`}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search conversations..."
                  type="search"
                  value={search}
                />
              </div>
            </div>

            <ChatbotListItem active={chatbotSelected} onClick={openChatbot} preview={chatbotPreview} />

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain" ref={conversationListRef}>
              {loadingList ? (
                <p className="px-4 py-6 text-sm text-slate-500">Loading conversations...</p>
              ) : filteredConversations.length === 0 ? (
                <p className="px-4 py-6 text-sm text-slate-500">
                  {search.trim()
                    ? 'No matching conversations.'
                    : mode === 'user'
                      ? 'No vendor conversations yet. Message a vendor from their profile page.'
                      : 'No customer messages yet.'}
                </p>
              ) : (
                filteredConversations.map((conversation) => {
                  const avatar = resolveProfileImageUrl(conversation.peerProfileImage)
                  const active = !chatbotSelected && conversation.id === selectedId
                  const menuOpen = conversationMenu?.conversationId === conversation.id
                  const isPinned = conversation.pinned ?? false
                  const isMuted = conversation.muted ?? false
                  const isBlocked = conversation.blocked ?? false
                  const hasUnread = conversation.unreadCount > 0
                  const rowClass = `group flex w-full cursor-pointer items-center gap-3 border-b border-slate-100 px-4 py-3 text-left transition ${
                    isBlocked
                      ? active
                        ? 'bg-slate-100/90 hover:bg-slate-100'
                        : 'bg-slate-50/90 hover:bg-slate-100/80'
                      : active
                        ? 'bg-teal-50/70 hover:bg-teal-50/70'
                        : 'hover:bg-slate-50'
                  }`

                  return (
                    <div
                      aria-selected={active}
                      className={rowClass}
                      key={conversation.id}
                      onClick={() => void openConversation(conversation.id)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          void openConversation(conversation.id)
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      {avatar ? (
                        <img
                          alt=""
                          className={`h-11 w-11 shrink-0 rounded-full border border-slate-200 object-cover ${
                            isBlocked ? 'opacity-60' : ''
                          }`}
                          src={avatar}
                        />
                      ) : (
                        <span
                          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-700 text-sm font-bold text-white ${
                            isBlocked ? 'opacity-60' : ''
                          }`}
                        >
                          {peerInitial(conversation.peerName)}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <span
                            className={`truncate text-sm font-semibold ${
                              isBlocked ? 'text-slate-500' : 'text-slate-900'
                            }`}
                          >
                            {conversation.peerName}
                          </span>
                          {isBlocked ? (
                            <span className="shrink-0 text-xs font-medium text-rose-400">Blocked</span>
                          ) : null}
                          {isPinned ? (
                            <LuPin
                              aria-label="Pinned conversation"
                              className={`h-3.5 w-3.5 shrink-0 text-teal-600 ${isBlocked ? 'opacity-60' : ''}`}
                              strokeWidth={2}
                            />
                          ) : null}
                        </div>
                        <p
                          className={`truncate text-xs ${
                            isBlocked ? 'text-slate-400' : 'text-slate-500'
                          }`}
                        >
                          {conversation.lastMessagePreview ?? 'Start a conversation'}
                        </p>
                      </div>
                      <div className="relative flex h-8 w-8 shrink-0 items-center justify-center self-center">
                        {hasUnread ? (
                          <span
                            className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                              menuOpen ? 'opacity-0' : 'opacity-100 group-hover:opacity-0'
                            }`}
                          >
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-bold text-white">
                              {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                            </span>
                          </span>
                        ) : isMuted ? (
                          <span
                            aria-label="Muted conversation"
                            className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                              menuOpen ? 'opacity-0' : 'opacity-100 group-hover:opacity-0'
                            }`}
                          >
                            <LuBellOff className="h-4 w-4 text-slate-500" strokeWidth={1.8} />
                          </span>
                        ) : null}
                        <button
                          aria-expanded={menuOpen}
                          aria-haspopup="menu"
                          aria-label="Conversation options"
                          className={`absolute inset-0 flex cursor-pointer items-center justify-center rounded-full border text-slate-500 transition hover:border-slate-200 hover:bg-slate-100 ${
                            menuOpen
                              ? 'border-slate-200 bg-slate-100 opacity-100'
                              : 'border-transparent opacity-0 group-hover:opacity-100'
                          }`}
                          onClick={(event) => openConversationMenu(conversation.id, event)}
                          type="button"
                        >
                          <FiMoreHorizontal className="cursor-pointer h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </aside>
          ) : null}

          {showConversationThread ? (
          <section className={`flex min-w-0 flex-col ${isPanel ? 'min-h-0 flex-1' : 'min-h-[420px] lg:min-h-0'}`}>
            {chatbotSelected ? (
              <>
                <header className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
                  {isPanel ? (
                    <button
                      aria-label="Back to conversations"
                      className="cursor-pointer rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
                      onClick={backToList}
                      type="button"
                    >
                      <FiArrowLeft className="h-4 w-4" />
                    </button>
                  ) : null}
                  <ChatbotAvatar />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="truncate text-sm font-semibold text-slate-900">Chatbot</h2>
                      <span className="text-[11px] font-medium text-violet-600">Assistant</span>
                    </div>
                    {mode === 'user' ? (
                      <p className="mt-0.5 text-[11px] leading-snug text-slate-500">
                        AI suggestions are for information only, not medical advice.
                      </p>
                    ) : null}
                  </div>
                </header>

                <div
                  className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain bg-slate-50 p-4"
                  ref={chatbotMessageListRef}
                >
                  {chatbotLoading ? (
                    <p className="text-sm text-slate-500">Loading chat history...</p>
                  ) : null}
                  {!chatbotLoading
                    ? chatbotMessages.map((message) => {
                    const isSelf = message.role === 'user'
                    return (
                      <div
                        className={`mb-3 flex min-w-0 items-end ${isSelf ? 'justify-end' : 'justify-start'}`}
                        key={message.id}
                      >
                        {!isSelf ? (
                          <span className="mr-2">
                            <ChatbotAvatar size="sm" />
                          </span>
                        ) : null}
                        <div
                          className={`min-w-0 max-w-[78%] overflow-hidden rounded-xl border px-3 py-2 shadow-sm ${
                            isSelf ? 'border-teal-200 bg-teal-50' : 'border-slate-200 bg-white'
                          }`}
                        >
                          {message.imageUrl ? (
                            <button
                              className="mb-2 block cursor-pointer overflow-hidden rounded-lg"
                              onClick={() => setPreviewUrl(message.imageUrl!)}
                              type="button"
                            >
                              <img
                                alt="Attachment"
                                className="max-h-48 max-w-full object-cover"
                                src={message.imageUrl}
                              />
                            </button>
                          ) : null}
                          {message.body ? (
                            <p className="whitespace-pre-wrap break-words text-sm text-slate-800">{message.body}</p>
                          ) : null}
                          {message.products && message.products.length > 0 ? (
                            <div className="mt-3 space-y-2 border-t border-slate-100 pt-3">
                              <p className="text-xs font-semibold text-slate-600">Available on MedNexus</p>
                              {message.products.map((product) => (
                                <Link
                                  className="flex gap-3 rounded-lg border border-slate-200 bg-slate-50 p-2 transition hover:border-teal-200 hover:bg-teal-50/40"
                                  key={product.id}
                                  to={`/productsdetail?id=${product.id}`}
                                >
                                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md border border-slate-200 bg-white">
                                    {product.imageUrl ? (
                                      <img
                                        alt={product.productName}
                                        className="h-full w-full object-contain p-1"
                                        src={product.imageUrl}
                                      />
                                    ) : (
                                      <span className="text-[10px] text-slate-400">No image</span>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-semibold text-slate-900">{product.productName}</p>
                                    <p className="truncate text-xs text-slate-500">{product.vendorBusinessName}</p>
                                    <p className="mt-1 text-xs font-semibold text-teal-700">
                                      NRP {product.price.toLocaleString()} · Stock {product.stock}
                                    </p>
                                  </div>
                                </Link>
                              ))}
                            </div>
                          ) : null}
                          <p className="mt-1 text-[11px] text-slate-400">
                            {formatMessageTime(message.createdAt)}
                          </p>
                        </div>
                        {isSelf ? (
                          <MessageAvatar
                            imageUrl={selfUser?.profileImage ?? null}
                            name={selfUser?.fullName ?? selfUser?.email ?? 'You'}
                            side="right"
                          />
                        ) : null}
                      </div>
                    )
                  })
                    : null}
                  {!chatbotLoading && chatbotSending ? (
                    <div className="mb-3 flex items-end justify-start">
                      <span className="mr-2">
                        <ChatbotAvatar size="sm" />
                      </span>
                      <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm">
                        <p className="text-sm text-slate-500">Thinking…</p>
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="border-t border-slate-200 bg-white p-3">
                  <div className="flex items-end gap-2">
                    <input
                      className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-teal-500"
                      onChange={(event) => setChatbotDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault()
                          void handleChatbotSend()
                        }
                      }}
                      placeholder={mode === 'vendor' ? 'Ask about orders or reviews…' : 'Ask symptoms or medicines…'}
                      type="text"
                      value={chatbotDraft}
                    />
                    <button
                      aria-label="Send message"
                      className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-teal-700 text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={chatbotSending || !chatbotDraft.trim()}
                      onClick={() => void handleChatbotSend()}
                      type="button"
                    >
                      <FiSend className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : selectedConversation ? (
              <>
                <header className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
                  {isPanel ? (
                    <button
                      aria-label="Back to conversations"
                      className="cursor-pointer rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
                      onClick={backToList}
                      type="button"
                    >
                      <FiArrowLeft className="h-4 w-4" />
                    </button>
                  ) : null}
                  {mode === 'vendor' && selectedConversation ? (
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      {resolveProfileImageUrl(selectedConversation.peerProfileImage) ? (
                        <img
                          alt=""
                          className="h-10 w-10 rounded-full border border-slate-200 object-cover"
                          referrerPolicy="no-referrer"
                          src={resolveProfileImageUrl(selectedConversation.peerProfileImage)!}
                        />
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-700 text-sm font-bold text-white">
                          {peerInitial(selectedConversation.peerName)}
                        </span>
                      )}
                      <div className="min-w-0">
                        <h2 className="truncate text-sm font-semibold text-slate-900">
                          {selectedConversation.peerName}
                        </h2>
                      </div>
                    </div>
                  ) : (
                    <Link
                      className="group flex min-w-0 flex-1 cursor-pointer items-center gap-3"
                      to={`/vendorprofile?id=${selectedConversation.peerId}`}
                    >
                      {resolveProfileImageUrl(selectedConversation.peerProfileImage) ? (
                        <img
                          alt=""
                          className="h-10 w-10 rounded-full border border-slate-200 object-cover"
                          src={resolveProfileImageUrl(selectedConversation.peerProfileImage)!}
                        />
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-700 text-sm font-bold text-white">
                          {peerInitial(selectedConversation.peerName)}
                        </span>
                      )}
                      <div className="min-w-0">
                        <h2 className="truncate text-sm font-semibold text-slate-900 underline-offset-2 transition group-hover:underline">
                          {selectedConversation.peerName}
                        </h2>
                        <p className="text-xs text-slate-500">Pharmacy vendor</p>
                      </div>
                    </Link>
                  )}
                </header>

                <div
                  className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain bg-slate-50 p-4"
                  ref={messageListRef}
                >
                  {loadingThread ? (
                    <p className="text-sm text-slate-500">Loading messages...</p>
                  ) : messages.length === 0 ? (
                    <p className="text-sm text-slate-500">No messages yet. Say hello!</p>
                  ) : (
                    messages.map((message) => {
                      const isSelf =
                        message.senderType === selfSenderType && message.senderId === selfId
                      const attachmentUrl = resolveMediaUrl(message.attachmentUrl)
                      const replied = message.replyToMessageId
                        ? messages.find((item) => item.id === message.replyToMessageId)
                        : null
                      return (
                        <div
                          className={`mb-3 flex min-w-0 items-end ${isSelf ? 'justify-end' : 'justify-start'}`}
                          key={message.id}
                        >
                          {!isSelf ? (
                            <MessageAvatar
                              imageUrl={peerDisplayImage}
                              name={peerDisplayName}
                              side="left"
                            />
                          ) : null}
                          <div
                            className={`min-w-0 max-w-[78%] overflow-hidden rounded-xl border px-3 py-2 shadow-sm ${
                              message.deleted
                                ? 'cursor-default border-slate-200 bg-slate-100'
                                : isSelf
                                  ? 'cursor-pointer border-teal-200 bg-teal-50'
                                  : 'cursor-pointer border-slate-200 bg-white'
                            }`}
                            onContextMenu={(event) => {
                              if (message.deleted) return
                              event.preventDefault()
                              setMessageMenu({
                                message,
                                x: event.clientX,
                                y: event.clientY,
                              })
                            }}
                          >
                            {mode === 'vendor' && !isSelf ? (
                              <p className="mb-1 text-[11px] font-semibold text-slate-500">
                                {peerDisplayName}
                              </p>
                            ) : null}
                            {replied ? (
                              <div className="mb-2 rounded-md border-l-2 border-slate-300 bg-slate-100/80 px-2 py-1">
                                <p className="text-[11px] font-semibold text-slate-500">Reply</p>
                                <p className="truncate text-xs text-slate-600">{replyPreview(replied)}</p>
                              </div>
                            ) : null}
                            {message.deleted ? (
                              <p className="text-sm italic text-slate-400">This message was deleted</p>
                            ) : (
                              <>
                                {attachmentUrl && message.attachmentKind === 'image' ? (
                                  <button
                                    className="mb-2 block cursor-pointer overflow-hidden rounded-lg"
                                    onClick={() => setPreviewUrl(attachmentUrl)}
                                    type="button"
                                  >
                                    <img
                                      alt={message.attachmentName ?? 'Attachment'}
                                      className="max-h-48 max-w-full object-cover"
                                      src={attachmentUrl}
                                    />
                                  </button>
                                ) : null}
                                {attachmentUrl && message.attachmentKind === 'pdf' ? (
                                  <a
                                    className="mb-2 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-teal-700 hover:bg-teal-50"
                                    href={attachmentUrl}
                                    rel="noreferrer"
                                    target="_blank"
                                  >
                                    <FiPaperclip className="h-4 w-4" />
                                    {message.attachmentName ?? 'View PDF'}
                                  </a>
                                ) : null}
                                {message.body ? (
                                  <p className="whitespace-pre-wrap break-words text-sm text-slate-800">{message.body}</p>
                                ) : null}
                              </>
                            )}
                            <p className="mt-1 text-[11px] text-slate-400">{formatMessageTime(message.createdAt)}</p>
                          </div>
                          {isSelf ? (
                            <MessageAvatar
                              imageUrl={selfUser?.profileImage ?? null}
                              name={selfUser?.fullName ?? selfUser?.email ?? 'You'}
                              side="right"
                            />
                          ) : null}
                        </div>
                      )
                    })
                  )}
                </div>

                <div className="border-t border-slate-200 bg-white p-3">
                  {isConversationBlocked ? (
                    <div className="mb-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                      You blocked this conversation. Unblock it from the menu to send messages again.
                    </div>
                  ) : null}
                  {replyTo ? (
                    <div className="mb-2 flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-500">Replying to</p>
                        <p className="truncate text-sm text-slate-700">{replyPreview(replyTo)}</p>
                      </div>
                      <button
                        aria-label="Cancel reply"
                        className="cursor-pointer rounded-md p-1 text-slate-500 hover:bg-slate-200"
                        onClick={() => setReplyTo(null)}
                        type="button"
                      >
                        <FiX className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null}
                  {pendingAttachment ? (
                    <div className="mb-2 flex items-center gap-3 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800">
                      {pendingAttachment.kind === 'image' ? (
                        <img
                          alt={pendingAttachment.fileName}
                          className="h-12 w-12 shrink-0 rounded-md border border-teal-200 object-cover"
                          src={resolveMediaUrl(pendingAttachment.url) ?? pendingAttachment.url}
                        />
                      ) : (
                        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-teal-200 bg-white">
                          <FiPaperclip className="h-5 w-5 text-teal-700" />
                        </span>
                      )}
                      <span className="min-w-0 flex-1 truncate">
                        {pendingAttachment.kind === 'image' ? 'Image' : 'PDF'} ready:{' '}
                        {pendingAttachment.fileName}
                      </span>
                      <button
                        aria-label="Remove attachment"
                        className="shrink-0 cursor-pointer rounded-md p-1 hover:bg-teal-100"
                        onClick={() => setPendingAttachment(null)}
                        type="button"
                      >
                        <FiX className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null}
                  <div className="flex items-end gap-2">
                    <input
                      accept={ACCEPTED_FILES}
                      className="hidden"
                      onChange={(event) => void handleFilePick(event)}
                      ref={fileInputRef}
                      type="file"
                    />
                    <button
                      aria-label="Attach image or PDF"
                      className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={uploading || selectedId == null || isConversationBlocked}
                      onClick={() => fileInputRef.current?.click()}
                      type="button"
                    >
                      <FiImage className="h-5 w-5" />
                    </button>
                    <textarea
                      className="min-h-[42px] flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500 disabled:cursor-not-allowed disabled:bg-slate-50"
                      disabled={isConversationBlocked}
                      onChange={(event) => setDraft(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' && !event.shiftKey) {
                          event.preventDefault()
                          void handleSend()
                        }
                      }}
                      placeholder="Type a message..."
                      rows={1}
                      value={draft}
                    />
                    <button
                      aria-label="Send message"
                      className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-lg bg-teal-700 text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={
                        sending ||
                        uploading ||
                        isConversationBlocked ||
                        (!draft.trim() && !pendingAttachment)
                      }
                      onClick={() => void handleSend()}
                      type="button"
                    >
                      <FiSend className="h-4 w-4" />
                    </button>
                  </div>
                  {mode === 'user' && !isPanel ? (
                    <p className="mt-2 text-[11px] text-slate-400">
                      Share product photos or PDFs. Right-click a message and choose Reply.
                    </p>
                  ) : null}
                </div>
              </>
            ) : !isPanel ? (
              <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-slate-500">
                Select a conversation to start messaging.
              </div>
            ) : null}
          </section>
          ) : null}
        </div>
      </div>

      {previewUrl ? (
        <div
          aria-label="Image preview"
          aria-modal="true"
          className="fixed inset-0 z-[60] flex cursor-default items-center justify-center bg-slate-900/80 p-4"
          onClick={() => setPreviewUrl(null)}
          role="dialog"
        >
          <button
            aria-label="Close image preview"
            className="absolute right-4 top-4 cursor-pointer rounded-full border border-white/30 bg-slate-900/50 p-2 text-white transition hover:bg-slate-900/80"
            onClick={() => setPreviewUrl(null)}
            type="button"
          >
            <FiX className="h-5 w-5" />
          </button>
          <img
            alt="Preview"
            className="max-h-[90vh] max-w-full rounded-lg object-contain"
            draggable={false}
            onClick={(event) => event.stopPropagation()}
            src={previewUrl}
          />
        </div>
      ) : null}

      {messageMenu
        ? createPortal(
            <div
              className="fixed z-[70] min-w-[188px] overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
              onClick={(event) => event.stopPropagation()}
              role="menu"
              style={{ left: messageMenu.x, top: messageMenu.y }}
            >
              {canReplyToMessage(messageMenu.message) ? (
                <button
                  className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  onClick={() => {
                    setReplyTo(messageMenu.message)
                    setMessageMenu(null)
                  }}
                  role="menuitem"
                  type="button"
                >
                  <FiCornerUpLeft className="h-4 w-4 shrink-0" />
                  Reply
                </button>
              ) : null}
              <button
                className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                onClick={() => void handleDeleteForMe(messageMenu.message)}
                role="menuitem"
                type="button"
              >
                <FiTrash2 className="h-4 w-4 shrink-0" />
                Delete for myself
              </button>
              {isOwnMessage(messageMenu.message) ? (
                <button
                  className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm font-medium text-rose-700 transition hover:bg-rose-50"
                  onClick={() => void handleDeleteForEveryone(messageMenu.message)}
                  role="menuitem"
                  type="button"
                >
                  <FiTrash2 className="h-4 w-4 shrink-0" />
                  Delete for everyone
                </button>
              ) : null}
            </div>,
            document.body,
          )
        : null}

      {conversationMenu && conversationMenuTarget
        ? createPortal(
            <div
              className="fixed z-[70] w-[220px] overflow-hidden rounded-xl border border-slate-200 bg-white py-1.5 shadow-xl"
              onClick={(event) => event.stopPropagation()}
              role="menu"
              style={{ left: conversationMenu.x, top: conversationMenu.y }}
            >
              <button
                className="flex w-full cursor-pointer items-center justify-between px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                onClick={() => void handleMarkConversationUnread(conversationMenu.conversationId)}
                role="menuitem"
                type="button"
              >
                <span>Mark as unread</span>
                <LuMailOpen className="h-4 w-4 shrink-0 text-slate-500" strokeWidth={1.8} />
              </button>
              <button
                className="flex w-full cursor-pointer items-center justify-between px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                onClick={() => void handleTogglePinConversation(conversationMenu.conversationId)}
                role="menuitem"
                type="button"
              >
                <span>{conversationMenuTarget.pinned ? 'Unpin' : 'Pin'}</span>
                {conversationMenuTarget.pinned ? (
                  <LuPinOff className="h-4 w-4 shrink-0 text-slate-500" strokeWidth={1.8} />
                ) : (
                  <LuPin className="h-4 w-4 shrink-0 text-slate-500" strokeWidth={1.8} />
                )}
              </button>
              <button
                className="flex w-full cursor-pointer items-center justify-between px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                onClick={() => void handleToggleMuteConversation(conversationMenu.conversationId)}
                role="menuitem"
                type="button"
              >
                <span>{conversationMenuTarget.muted ? 'Unmute' : 'Mute'}</span>
                {conversationMenuTarget.muted ? (
                  <LuBell className="h-4 w-4 shrink-0 text-slate-500" strokeWidth={1.8} />
                ) : (
                  <LuBellOff className="h-4 w-4 shrink-0 text-slate-500" strokeWidth={1.8} />
                )}
              </button>
              <button
                className="flex w-full cursor-pointer items-center justify-between px-4 py-2.5 text-left text-sm font-medium text-rose-600 transition hover:bg-rose-50"
                onClick={() => void handleDeleteConversation(conversationMenu.conversationId)}
                role="menuitem"
                type="button"
              >
                <span>Delete</span>
                <FiTrash2 className="h-4 w-4 shrink-0" />
              </button>
              <button
                className="flex w-full cursor-pointer items-center justify-between px-4 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                onClick={() => void handleBlockConversation(conversationMenu.conversationId)}
                role="menuitem"
                type="button"
              >
                <span>{conversationMenuTarget.blocked ? 'Unblock' : 'Block'}</span>
                <LuBan className="h-4 w-4 shrink-0 text-slate-500" strokeWidth={1.8} />
              </button>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

export default MessagingPage
