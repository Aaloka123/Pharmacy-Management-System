import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { FiArrowLeft, FiCornerUpLeft, FiImage, FiPaperclip, FiSend, FiTrash2, FiX } from 'react-icons/fi'
import { HiOutlineMagnifyingGlass } from 'react-icons/hi2'
import { toast } from 'react-toastify'
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
  type ChatMessageDto,
  type ConversationDto,
  uploadMessageAttachment,
  sendMessageRest,
} from '../lib/messageApi'
import { refreshVendorNavBadges } from '../lib/vendorNavBadges'
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

function formatListTime(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const now = new Date()
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  if (sameDay) {
    return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
  }
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
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
      className={`flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-teal-700 text-[10px] font-bold text-white ${
        side === 'left' ? 'mr-2' : 'ml-2'
      }`}
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

const MessagingPage = ({ mode, initialVendorId, initialConversationId, layout = 'page' }: MessagingPageProps) => {
  const isPanel = layout === 'panel'
  const selfSenderType = mode === 'vendor' ? 'VENDOR' : 'USER'
  const [conversations, setConversations] = useState<ConversationDto[]>([])
  const [selectedId, setSelectedId] = useState<number | null>(null)
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
  const [pendingAttachment, setPendingAttachment] = useState<{
    url: string
    fileName: string
    mimeType: string
    kind: 'image' | 'pdf' | 'file'
  } | null>(null)

  const messageListRef = useRef<HTMLDivElement>(null)
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
    if (!query) return conversations
    return conversations.filter((conversation) => conversation.peerName.toLowerCase().includes(query))
  }, [conversations, search])

  const scrollToBottom = useCallback(() => {
    const el = messageListRef.current
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  }, [])

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
      setSelectedId(conversationId)
      setReplyTo(null)
      setMessageMenu(null)
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

  useEffect(() => {
    void loadConversations()
  }, [loadConversations])

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

    const cleanups = [messageListRef.current, conversationListRef.current]
      .filter((element): element is HTMLDivElement => element != null)
      .map(lockScrollChain)

    return () => {
      cleanups.forEach((cleanup) => cleanup())
    }
  }, [isPanel, messages.length, filteredConversations.length, selectedId])

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
    if (selectedId == null || sending) return
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

  const showConversationList = !isPanel || selectedId == null
  const showConversationThread = !isPanel || selectedId != null

  const backToList = () => {
    setSelectedId(null)
    setMessages([])
    setReplyTo(null)
    setMessageMenu(null)
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

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain" ref={conversationListRef}>
              {loadingList ? (
                <p className="px-4 py-6 text-sm text-slate-500">Loading conversations...</p>
              ) : filteredConversations.length === 0 ? (
                <p className="px-4 py-6 text-sm text-slate-500">
                  {mode === 'user'
                    ? 'No conversations yet. Message a vendor from their profile page.'
                    : 'No customer messages yet.'}
                </p>
              ) : (
                filteredConversations.map((conversation) => {
                  const avatar = resolveProfileImageUrl(conversation.peerProfileImage)
                  const active = conversation.id === selectedId
                  return (
                    <button
                      className={`flex w-full cursor-pointer items-center gap-3 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 ${
                        active ? 'bg-teal-50/70' : ''
                      }`}
                      key={conversation.id}
                      onClick={() => void openConversation(conversation.id)}
                      type="button"
                    >
                      {avatar ? (
                        <img
                          alt=""
                          className="h-11 w-11 shrink-0 rounded-full border border-slate-200 object-cover"
                          src={avatar}
                        />
                      ) : (
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal-700 text-sm font-bold text-white">
                          {peerInitial(conversation.peerName)}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-sm font-semibold text-slate-900">
                            {conversation.peerName}
                          </span>
                          <span className="shrink-0 text-[11px] text-slate-400">
                            {formatListTime(conversation.lastMessageAt)}
                          </span>
                        </div>
                        <p className="truncate text-xs text-slate-500">
                          {conversation.lastMessagePreview ?? 'Start a conversation'}
                        </p>
                      </div>
                      {conversation.unreadCount > 0 ? (
                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500 px-1.5 text-[10px] font-bold text-white">
                          {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                        </span>
                      ) : null}
                    </button>
                  )
                })
              )}
            </div>
          </aside>
          ) : null}

          {showConversationThread ? (
          <section className={`flex min-w-0 flex-col ${isPanel ? 'min-h-0 flex-1' : 'min-h-[420px] lg:min-h-0'}`}>
            {selectedConversation ? (
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
                  className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-slate-50 p-4"
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
                          className={`mb-3 flex items-end ${isSelf ? 'justify-end' : 'justify-start'}`}
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
                            className={`max-w-[78%] rounded-xl border px-3 py-2 shadow-sm ${
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
                                  <p className="whitespace-pre-wrap text-sm text-slate-800">{message.body}</p>
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
                      disabled={uploading || selectedId == null}
                      onClick={() => fileInputRef.current?.click()}
                      type="button"
                    >
                      <FiImage className="h-5 w-5" />
                    </button>
                    <textarea
                      className="min-h-[42px] flex-1 resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500"
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
                      disabled={sending || uploading || (!draft.trim() && !pendingAttachment)}
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
    </div>
  )
}

export default MessagingPage
