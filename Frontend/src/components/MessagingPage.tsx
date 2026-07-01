import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { FiArrowLeft, FiImage, FiPaperclip, FiSend, FiX } from 'react-icons/fi'
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
  const [pendingAttachment, setPendingAttachment] = useState<{
    url: string
    fileName: string
    mimeType: string
    kind: 'image' | 'pdf' | 'file'
  } | null>(null)

  const messageListRef = useRef<HTMLDivElement>(null)
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
        const incoming = JSON.parse(frame.body) as ChatMessageDto
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
    if (message.body) return message.body
    if (message.attachmentKind === 'pdf') return 'PDF document'
    if (message.attachmentKind === 'image') return 'Photo'
    return 'Attachment'
  }

  const selfId = getStoredUser()?.id

  const showConversationList = !isPanel || selectedId == null
  const showConversationThread = !isPanel || selectedId != null

  const backToList = () => {
    setSelectedId(null)
    setMessages([])
    setReplyTo(null)
    setPendingAttachment(null)
  }

  return (
    <div
      className={
        isPanel
          ? 'flex h-full min-h-0 flex-col bg-white'
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

            <div className="min-h-0 flex-1 overflow-y-auto">
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
                      className={`flex w-full items-center gap-3 border-b border-slate-100 px-4 py-3 text-left transition hover:bg-slate-50 ${
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
                      className="rounded-lg p-1.5 text-slate-600 hover:bg-slate-100"
                      onClick={backToList}
                      type="button"
                    >
                      <FiArrowLeft className="h-4 w-4" />
                    </button>
                  ) : null}
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
                  <div>
                    <h2 className="text-sm font-semibold text-slate-900">{selectedConversation.peerName}</h2>
                    <p className="text-xs text-slate-500">
                      {mode === 'user' ? 'Pharmacy vendor' : 'Customer'}
                    </p>
                  </div>
                </header>

                <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-4" ref={messageListRef}>
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
                          className={`mb-3 flex ${isSelf ? 'justify-end' : 'justify-start'}`}
                          key={message.id}
                        >
                          <div
                            className={`max-w-[78%] rounded-xl border px-3 py-2 shadow-sm ${
                              isSelf
                                ? 'border-teal-200 bg-teal-50'
                                : 'border-slate-200 bg-white'
                            }`}
                            onContextMenu={(event) => {
                              event.preventDefault()
                              setReplyTo(message)
                            }}
                          >
                            {replied ? (
                              <div className="mb-2 rounded-md border-l-2 border-slate-300 bg-slate-100/80 px-2 py-1">
                                <p className="text-[11px] font-semibold text-slate-500">Reply</p>
                                <p className="truncate text-xs text-slate-600">{replyPreview(replied)}</p>
                              </div>
                            ) : null}
                            {attachmentUrl && message.attachmentKind === 'image' ? (
                              <button
                                className="mb-2 block overflow-hidden rounded-lg"
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
                            <p className="mt-1 text-[11px] text-slate-400">{formatMessageTime(message.createdAt)}</p>
                          </div>
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
                        className="rounded-md p-1 text-slate-500 hover:bg-slate-200"
                        onClick={() => setReplyTo(null)}
                        type="button"
                      >
                        <FiX className="h-4 w-4" />
                      </button>
                    </div>
                  ) : null}
                  {pendingAttachment ? (
                    <div className="mb-2 flex items-center justify-between rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm text-teal-800">
                      <span className="truncate">
                        {pendingAttachment.kind === 'image' ? 'Image' : 'PDF'} ready: {pendingAttachment.fileName}
                      </span>
                      <button
                        aria-label="Remove attachment"
                        className="rounded-md p-1 hover:bg-teal-100"
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
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
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
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-700 text-white hover:bg-teal-800 disabled:opacity-50"
                      disabled={sending || uploading || (!draft.trim() && !pendingAttachment)}
                      onClick={() => void handleSend()}
                      type="button"
                    >
                      <FiSend className="h-4 w-4" />
                    </button>
                  </div>
                  <p className={`text-[11px] text-slate-400 ${isPanel ? 'hidden' : 'mt-2'}`}>
                    Share product photos or PDFs. Right-click a message to reply.
                  </p>
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
        <button
          aria-label="Close image preview"
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/80 p-4"
          onClick={() => setPreviewUrl(null)}
          type="button"
        >
          <img alt="Preview" className="max-h-[90vh] max-w-full rounded-lg object-contain" src={previewUrl} />
        </button>
      ) : null}
    </div>
  )
}

export default MessagingPage
