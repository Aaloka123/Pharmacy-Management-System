import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { FiImage, FiMoreHorizontal, FiTrash2 } from 'react-icons/fi'
import { HiOutlineMagnifyingGlass, HiOutlineShieldCheck } from 'react-icons/hi2'
import { LuBan, LuBell, LuBellOff, LuMailOpen, LuPin, LuPinOff } from 'react-icons/lu'
import Navbar from '../VendorComponents/Navbar'
import { VendorLayout, VendorMain, FadeInOnScroll } from '../components/PortalMain'
import MednexuxLogo from '../assets/Mednexux.png'

const CHATBOT_USER_ID = 'chatbot'

type ChatUser = {
  id: string
  name: string
  lastMessage: string
  isOnline: boolean
  lastOnline: string
  avatarColor: string
  isAiAssistant?: boolean
}

type MessageSender = 'vendor' | 'user' | 'assistant'

type ChatMessage = {
  id: string
  sender: MessageSender
  text?: string
  imageUrl?: string
  replyTo?: {
    sender: MessageSender
    text?: string
    imageUrl?: string
  }
  time: string
}

const replySenderLabel = (sender: MessageSender, peerName: string | undefined) => {
  if (sender === 'vendor') return 'Vendor'
  if (sender === 'assistant') return 'Chatbot'
  return peerName ?? 'User'
}

const conversationMenuItemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
  width: '100%',
  textAlign: 'left',
  padding: '8px 10px',
  border: 'none',
  borderRadius: '6px',
  backgroundColor: '#ffffff',
  color: '#475569',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
}

const conversationMenuIconProps = { size: 16, strokeWidth: 2.1 } as const

const unreadConversationListDotStyle: CSSProperties = {
  width: '10px',
  height: '10px',
  borderRadius: '999px',
  flexShrink: 0,
  backgroundColor: '#10b981',
}

const VendorMessage = () => {
  const users: ChatUser[] = useMemo(
    () => [
      {
        id: CHATBOT_USER_ID,
        name: 'Chatbot',
        lastMessage: 'Hi! I am your AI assistant. How can I help today?',
        isOnline: true,
        lastOnline: 'Always available',
        avatarColor: '#0f766e',
        isAiAssistant: true,
      },
      {
        id: 'u1',
        name: 'Aaloka Poudel',
        lastMessage: 'Can I book service for tomorrow?',
        isOnline: true,
        lastOnline: 'Today 11:20 AM',
        avatarColor: '#0d9488',
      },
      {
        id: 'u2',
        name: 'Nivesh Shrestha',
        lastMessage: 'Please update my order status.',
        isOnline: false,
        lastOnline: 'Today 10:58 AM',
        avatarColor: '#0284c7',
      },
      {
        id: 'u3',
        name: 'Nivv',
        lastMessage: 'Do you have premium brake kits?',
        isOnline: false,
        lastOnline: 'Yesterday 7:42 PM',
        avatarColor: '#0ea5a4',
      },
    ],
    []
  )

  const [selectedUserId, setSelectedUserId] = useState('u1')
  const [removedUserIds, setRemovedUserIds] = useState<Set<string>>(new Set())
  const [pinnedUserIds, setPinnedUserIds] = useState<string[]>([])
  const [unreadByUserId, setUnreadByUserId] = useState<Record<string, boolean>>({})
  const [blockedUserIds, setBlockedUserIds] = useState<Set<string>>(new Set())
  const [mutedUserIds, setMutedUserIds] = useState<Set<string>>(new Set())
  const [conversationMenuUserId, setConversationMenuUserId] = useState<string | null>(null)
  const [hoveredConversationUserId, setHoveredConversationUserId] = useState<string | null>(null)
  const [userSearch, setUserSearch] = useState('')
  const [messageInput, setMessageInput] = useState('')
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)
  const [replyTarget, setReplyTarget] = useState<ChatMessage | null>(null)
  const messageListRef = useRef<HTMLDivElement | null>(null)
  const [messagesByUser, setMessagesByUser] = useState<Record<string, ChatMessage[]>>({
    [CHATBOT_USER_ID]: [
      {
        id: 'cb-m1',
        sender: 'assistant',
        text: 'Hi! I am your AI assistant. Ask me about orders, stock, or invoices.',
        time: '9:00 AM',
      },
      {
        id: 'cb-m2',
        sender: 'vendor',
        text: 'Summarize today’s orders.',
        time: '9:02 AM',
      },
      {
        id: 'cb-m3',
        sender: 'assistant',
        text: 'You have 7 new orders and 3 pending deliveries today.',
        time: '9:02 AM',
      },
    ],
    u1: [
      { id: 'm1', sender: 'user', text: 'Hello vendor, I need help.', time: '10:30 AM' },
      { id: 'm2', sender: 'vendor', text: 'Sure, please share your requirement.', time: '10:32 AM' },
      { id: 'm3', sender: 'user', text: 'Can I book service for tomorrow?', time: '10:34 AM' },
    ],
    u2: [
      { id: 'm4', sender: 'user', text: 'Please update my order status.', time: '9:58 AM' },
      { id: 'm5', sender: 'vendor', text: 'Your order is packed and will ship today.', time: '10:05 AM' },
    ],
    u3: [{ id: 'm6', sender: 'user', text: 'Do you have premium brake kits?', time: '9:46 AM' }],
  })

  const visibleUsers = useMemo(
    () => users.filter((user) => !removedUserIds.has(user.id)),
    [users, removedUserIds]
  )

  const orderedUsers = useMemo(() => {
    const chatbotUser = visibleUsers.find((u) => u.id === CHATBOT_USER_ID)
    const others = visibleUsers.filter((u) => u.id !== CHATBOT_USER_ID)
    const pinned = pinnedUserIds.filter((id) => others.some((u) => u.id === id))
    const pinnedSet = new Set(pinned)
    const rest = others.filter((u) => !pinnedSet.has(u.id))
    const pinnedUsers = pinned
      .map((id) => others.find((u) => u.id === id))
      .filter((u): u is ChatUser => Boolean(u))
    const orderedRest = [...pinnedUsers, ...rest]
    return chatbotUser ? [chatbotUser, ...orderedRest] : orderedRest
  }, [visibleUsers, pinnedUserIds])

  const selectedUser = orderedUsers.find((user) => user.id === selectedUserId)
  const selectedMessages = messagesByUser[selectedUserId] ?? []
  const filteredUsers = orderedUsers.filter((user) => user.name.toLowerCase().includes(userSearch.toLowerCase()))

  useEffect(() => {
    if (orderedUsers.length === 0) return
    if (!orderedUsers.some((user) => user.id === selectedUserId)) {
      setSelectedUserId(orderedUsers[0].id)
    }
  }, [orderedUsers, selectedUserId])

  useEffect(() => {
    if (!conversationMenuUserId) return
    const closeOnOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null
      if (!target?.closest('[data-conversation-menu]')) {
        setConversationMenuUserId(null)
      }
    }
    document.addEventListener('mousedown', closeOnOutside)
    return () => document.removeEventListener('mousedown', closeOnOutside)
  }, [conversationMenuUserId])

  useEffect(() => {
    const messageList = messageListRef.current
    if (!messageList) return
    messageList.scrollTop = messageList.scrollHeight
  }, [selectedUserId, selectedMessages.length])

  const togglePinConversation = (userId: string) => {
    setPinnedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [userId, ...prev.filter((id) => id !== userId)]
    )
    setConversationMenuUserId(null)
  }

  const deleteConversation = (userId: string) => {
    if (userId === CHATBOT_USER_ID) return
    setRemovedUserIds((prev) => new Set(prev).add(userId))
    setConversationMenuUserId(null)
    setPinnedUserIds((prev) => prev.filter((id) => id !== userId))
    setUnreadByUserId((prev) => {
      const next = { ...prev }
      delete next[userId]
      return next
    })
    setBlockedUserIds((prev) => {
      const next = new Set(prev)
      next.delete(userId)
      return next
    })
    setMutedUserIds((prev) => {
      const next = new Set(prev)
      next.delete(userId)
      return next
    })
  }

  const markConversationUnread = (userId: string) => {
    setUnreadByUserId((prev) => ({ ...prev, [userId]: true }))
    setConversationMenuUserId(null)
  }

  const toggleBlockConversation = (userId: string) => {
    setBlockedUserIds((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
    setConversationMenuUserId(null)
  }

  const toggleMuteConversation = (userId: string) => {
    setMutedUserIds((prev) => {
      const next = new Set(prev)
      if (next.has(userId)) next.delete(userId)
      else next.add(userId)
      return next
    })
    setConversationMenuUserId(null)
  }

  const handleSendMessage = () => {
    const text = messageInput.trim()
    if (!text && !selectedImageUrl) return

    const newMessage: ChatMessage = {
      id: `${selectedUserId}-${Date.now()}`,
      sender: 'vendor',
      text: text || undefined,
      imageUrl: selectedImageUrl || undefined,
      replyTo: replyTarget
        ? {
            sender: replyTarget.sender,
            text: replyTarget.text,
            imageUrl: replyTarget.imageUrl,
          }
        : undefined,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    setMessagesByUser((prev) => ({
      ...prev,
      [selectedUserId]: [...(prev[selectedUserId] ?? []), newMessage],
    }))
    setMessageInput('')
    setSelectedImageUrl(null)
    setReplyTarget(null)
  }

  return (
    <VendorLayout>
      <Navbar />
      <VendorMain>
      <FadeInOnScroll>
        <div style={{ marginBottom: '14px', flexShrink: 0 }}>
          <h1 className="text-2xl font-bold text-slate-900">Message</h1>
        </div>

        <div
          style={{
            height: 'calc(100vh - 112px)',
            minHeight: '620px',
            display: 'grid',
            gridTemplateColumns: '300px 1fr',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            backgroundColor: '#ffffff',
            overflow: 'hidden',
          }}
        >
          <aside
            style={{
              borderRight: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                flexShrink: 0,
                padding: '12px 14px',
                borderBottom: '1px solid #e2e8f0',
                fontWeight: 600,
              }}
            >
              User Conversations
            </div>

            <div
              style={{
                flexShrink: 0,
                padding: '10px 12px',
                borderBottom: '1px solid #e2e8f0',
                position: 'relative',
              }}
            >
              <HiOutlineMagnifyingGlass
                style={{
                  position: 'absolute',
                  left: '22px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                  pointerEvents: 'none',
                }}
                size={16}
              />
              <input
                type="text"
                value={userSearch}
                onChange={(event) => setUserSearch(event.target.value)}
                placeholder="Search user..."
                autoComplete="off"
                style={{
                  width: '100%',
                  padding: '8px 10px 8px 34px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '13px',
                  outline: 'none',
                }}
              />
            </div>

            <div
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                overflowX: 'hidden',
                scrollbarWidth: 'thin',
              }}
            >
              {filteredUsers.map((user) => {
                const isActive = user.id === selectedUserId
                const isPinned = pinnedUserIds.includes(user.id)
                const isBlocked = blockedUserIds.has(user.id)
                const isMuted = mutedUserIds.has(user.id)
                const hasUnread = Boolean(unreadByUserId[user.id])
                const menuOpen = conversationMenuUserId === user.id
                const showRightActionsColumn =
                  isMuted ||
                  hasUnread ||
                  hoveredConversationUserId === user.id ||
                  conversationMenuUserId === user.id
                const showMuteIconInActionsSlot =
                  isMuted && !menuOpen && hoveredConversationUserId !== user.id
                const showThreeDotButton =
                  isMuted ? !showMuteIconInActionsSlot : menuOpen || hoveredConversationUserId === user.id

                return (
                  <div
                    key={user.id}
                    onMouseEnter={() => setHoveredConversationUserId(user.id)}
                    onMouseLeave={(event) => {
                      const next = event.relatedTarget as Node | null
                      if (next && event.currentTarget.contains(next)) return
                      setHoveredConversationUserId((current) => (current === user.id ? null : current))
                    }}
                    style={{
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      borderBottom: '1px solid #e2e8f0',
                      backgroundColor: isActive ? '#ccfbf1' : 'transparent',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUserId(user.id)
                        setUnreadByUserId((prev) => ({ ...prev, [user.id]: false }))
                      }}
                      style={{
                        flex: 1,
                        minWidth: 0,
                        textAlign: 'left',
                        border: 'none',
                        backgroundColor: 'transparent',
                        padding: '12px 6px 12px 14px',
                        cursor: 'pointer',
                        opacity: isBlocked ? 0.55 : 1,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ flexShrink: 0 }}>
                          <div
                            style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '999px',
                              backgroundColor: user.avatarColor,
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: 700,
                            }}
                          >
                            {user.isAiAssistant ? 'AI' : getInitials(user.name)}
                          </div>
                        </div>

                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              minWidth: 0,
                            }}
                          >
                            <span
                              style={{
                                fontSize: '14px',
                                fontWeight: hasUnread ? 700 : 600,
                                color: '#1e293b',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {user.name}
                            </span>
                            {isPinned ? (
                              <span
                                title="Pinned"
                                aria-label="Pinned"
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  color: '#0f766e',
                                  flexShrink: 0,
                                }}
                              >
                                <LuPin size={14} strokeWidth={2.25} aria-hidden />
                              </span>
                            ) : null}
                            {isBlocked ? (
                              <span style={{ fontSize: '10px', fontWeight: 600, color: '#b91c1c' }}>Blocked</span>
                            ) : null}
                            {user.isAiAssistant ? (
                              <span
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  color: '#0f766e',
                                  backgroundColor: '#ccfbf1',
                                  borderRadius: '999px',
                                  padding: '2px 8px',
                                  lineHeight: 1.2,
                                }}
                              >
                                Assistant
                              </span>
                            ) : null}
                          </div>
                          <div
                            style={{
                              fontSize: '12px',
                              fontWeight: hasUnread ? 700 : 400,
                              color: hasUnread ? '#334155' : '#64748b',
                              marginTop: '3px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {user.lastMessage}
                          </div>
                        </div>
                      </div>
                    </button>

                    <div
                      data-conversation-menu
                      style={{
                        flexShrink: 0,
                        alignSelf: 'center',
                        padding: '0 10px 0 4px',
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: '8px',
                        position: 'relative',
                        opacity: showRightActionsColumn ? 1 : 0,
                        pointerEvents: showRightActionsColumn ? 'auto' : 'none',
                        transition: 'opacity 120ms ease',
                      }}
                    >
                      <div
                        style={{
                          position: 'relative',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {showMuteIconInActionsSlot ? (
                          <span
                            title="Muted — hover the row for options"
                            aria-label="Muted. Hover the conversation row for options."
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#64748b',
                              flexShrink: 0,
                              minWidth: '30px',
                              minHeight: '30px',
                            }}
                          >
                            <LuBellOff size={18} strokeWidth={2.25} aria-hidden />
                          </span>
                        ) : (
                          <button
                            type="button"
                            aria-label="Conversation options"
                            aria-expanded={menuOpen}
                            onClick={(event) => {
                              event.stopPropagation()
                              setConversationMenuUserId((current) => (current === user.id ? null : user.id))
                            }}
                            style={{
                              width: '30px',
                              height: '30px',
                              borderRadius: '999px',
                              border: '1px solid #e2e8f0',
                              backgroundColor: '#ffffff',
                              color: '#64748b',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)',
                              flexShrink: 0,
                              opacity: showThreeDotButton ? 1 : 0,
                              pointerEvents: showThreeDotButton ? 'auto' : 'none',
                              transition: 'opacity 120ms ease',
                            }}
                          >
                            <FiMoreHorizontal size={16} strokeWidth={2.5} />
                          </button>
                        )}

                        {menuOpen ? (
                          <div
                            role="menu"
                            style={{
                              position: 'absolute',
                              right: '0',
                              top: '100%',
                              marginTop: '6px',
                              minWidth: '168px',
                              padding: '6px',
                              borderRadius: '10px',
                              border: '1px solid #e2e8f0',
                              backgroundColor: '#ffffff',
                              boxShadow: '0 4px 20px rgba(15, 23, 42, 0.08)',
                              zIndex: 20,
                            }}
                          >
                            {!hasUnread ? (
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => markConversationUnread(user.id)}
                                style={conversationMenuItemStyle}
                              >
                                <span>Mark as unread</span>
                                <LuMailOpen {...conversationMenuIconProps} aria-hidden style={{ flexShrink: 0 }} />
                              </button>
                            ) : null}
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => togglePinConversation(user.id)}
                              style={conversationMenuItemStyle}
                            >
                              <span>{isPinned ? 'Unpin' : 'Pin'}</span>
                              {isPinned ? (
                                <LuPinOff {...conversationMenuIconProps} aria-hidden style={{ flexShrink: 0 }} />
                              ) : (
                                <LuPin {...conversationMenuIconProps} aria-hidden style={{ flexShrink: 0 }} />
                              )}
                            </button>
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => toggleMuteConversation(user.id)}
                              style={conversationMenuItemStyle}
                            >
                              <span>{isMuted ? 'Unmute' : 'Mute'}</span>
                              {isMuted ? (
                                <LuBell {...conversationMenuIconProps} aria-hidden style={{ flexShrink: 0 }} />
                              ) : (
                                <LuBellOff {...conversationMenuIconProps} aria-hidden style={{ flexShrink: 0 }} />
                              )}
                            </button>
                            {user.isAiAssistant ? null : (
                              <button
                                type="button"
                                role="menuitem"
                                onClick={() => {
                                  const ok = window.confirm(
                                    `Delete the conversation with "${user.name}"? This will remove it from your list and cannot be undone.`
                                  )
                                  if (!ok) return
                                  deleteConversation(user.id)
                                }}
                                style={{ ...conversationMenuItemStyle, color: '#b91c1c' }}
                              >
                                <span>Delete</span>
                                <FiTrash2 size={16} strokeWidth={2} aria-hidden style={{ flexShrink: 0 }} />
                              </button>
                            )}
                            <button
                              type="button"
                              role="menuitem"
                              onClick={() => toggleBlockConversation(user.id)}
                              style={conversationMenuItemStyle}
                            >
                              <span>{isBlocked ? 'Unblock' : 'Block'}</span>
                              {isBlocked ? (
                                <HiOutlineShieldCheck size={18} aria-hidden style={{ flexShrink: 0 }} />
                              ) : (
                                <LuBan {...conversationMenuIconProps} aria-hidden style={{ flexShrink: 0 }} />
                              )}
                            </button>
                          </div>
                        ) : null}
                      </div>
                      {hasUnread ? (
                        <span
                          title="Unread messages"
                          aria-label="Unread messages"
                          style={unreadConversationListDotStyle}
                        />
                      ) : null}
                    </div>
                  </div>
                )
              })}
              {filteredUsers.length === 0 ? (
                <div style={{ padding: '12px', fontSize: '12px', color: '#64748b' }}>No users found.</div>
              ) : null}
            </div>
          </aside>

          <section style={{ display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden' }}>
            <header
              style={{
                borderBottom: '1px solid #e2e8f0',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '999px',
                  backgroundColor: selectedUser?.avatarColor ?? '#94a3b8',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: 700,
                }}
              >
                {selectedUser?.isAiAssistant ? 'AI' : getInitials(selectedUser?.name ?? 'U')}
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 600, color: '#1e293b' }}>
                  {selectedUser?.name ?? 'Select a user'}
                </div>
                {selectedUser ? (
                  <div
                    style={{
                      fontSize: '12px',
                      marginTop: '2px',
                      color: selectedUser.isAiAssistant ? '#0f766e' : selectedUser.isOnline ? '#059669' : '#94a3b8',
                      fontWeight: selectedUser.isAiAssistant || selectedUser.isOnline ? 600 : 500,
                    }}
                  >
                    {selectedUser.isAiAssistant
                      ? 'AI assistant · Ready to help'
                      : selectedUser.isOnline
                        ? 'Online'
                        : `Last online on ${selectedUser.lastOnline}`}
                  </div>
                ) : null}
              </div>
            </header>

            <div
              ref={messageListRef}
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                padding: '14px',
                backgroundColor: '#f8fafc',
              }}
            >
              {selectedMessages.map((message) => (
                <div
                  key={message.id}
                  style={{
                    display: 'flex',
                    justifyContent: message.sender === 'vendor' ? 'flex-end' : 'flex-start',
                    marginBottom: '10px',
                  }}
                >
                  {(message.sender === 'user' || message.sender === 'assistant') && (
                    <div
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '999px',
                        backgroundColor:
                          message.sender === 'assistant' ? '#0f766e' : selectedUser?.avatarColor ?? '#94a3b8',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: message.sender === 'assistant' ? '9px' : '11px',
                        fontWeight: 700,
                        marginRight: '8px',
                        flexShrink: 0,
                      }}
                    >
                      {message.sender === 'assistant' ? 'AI' : getInitials(selectedUser?.name ?? 'U')}
                    </div>
                  )}
                  <div
                    onContextMenu={(event) => {
                      event.preventDefault()
                      setReplyTarget(message)
                    }}
                    style={{
                      maxWidth: '70%',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      backgroundColor:
                        message.sender === 'vendor'
                          ? '#ccfbf1'
                          : message.sender === 'assistant'
                            ? '#ecfeff'
                            : '#ffffff',
                      border: message.sender === 'assistant' ? '1px solid #99f6e4' : '1px solid #e2e8f0',
                    }}
                  >
                    {message.replyTo ? (
                      <div
                        style={{
                          borderLeft: '3px solid #94a3b8',
                          paddingLeft: '8px',
                          marginBottom: '8px',
                          backgroundColor: '#f8fafc',
                          borderRadius: '6px',
                        }}
                      >
                        <div style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>
                          Reply to {replySenderLabel(message.replyTo.sender, selectedUser?.name)}
                        </div>
                        {message.replyTo.imageUrl ? (
                          <div style={{ fontSize: '11px', color: '#475569' }}>Image</div>
                        ) : null}
                        {message.replyTo.text ? (
                          <div style={{ fontSize: '12px', color: '#475569' }}>{message.replyTo.text}</div>
                        ) : null}
                      </div>
                    ) : null}
                    {message.imageUrl ? (
                      <img
                        src={message.imageUrl}
                        alt="Message attachment"
                        onClick={() => setPreviewImageUrl(message.imageUrl ?? null)}
                        style={{
                          maxWidth: '220px',
                          maxHeight: '180px',
                          width: '100%',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          display: 'block',
                          marginBottom: message.text ? '8px' : '0',
                          cursor: 'zoom-in',
                        }}
                      />
                    ) : null}
                    {message.text ? <div style={{ fontSize: '15px', color: '#334155' }}>{message.text}</div> : null}
                    <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '5px' }}>{message.time}</div>
                  </div>
                  {message.sender === 'vendor' && (
                    <img
                      src={MednexuxLogo}
                      alt="Vendor"
                      style={{
                        width: '34px',
                        height: '34px',
                        borderRadius: '8px',
                        objectFit: 'contain',
                        backgroundColor: '#ffffff',
                        padding: '2px',
                        boxSizing: 'border-box',
                        border: '1px solid #e2e8f0',
                        marginLeft: '8px',
                        flexShrink: 0,
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            <div
              style={{
                borderTop: '1px solid #e2e8f0',
                padding: '10px 12px',
                flexShrink: 0,
                backgroundColor: '#ffffff',
              }}
            >
              {replyTarget ? (
                <div
                  style={{
                    marginBottom: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px',
                    padding: '8px 10px',
                    border: '1px solid #dbe2ea',
                    borderRadius: '8px',
                    backgroundColor: '#f8fafc',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b' }}>
                      Replying to {replySenderLabel(replyTarget.sender, selectedUser?.name)}
                    </div>
                    <div style={{ fontSize: '13px', color: '#475569' }}>
                      {replyTarget.text ?? (replyTarget.imageUrl ? 'Image' : 'Message')}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplyTarget(null)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      backgroundColor: '#ffffff',
                      color: '#334155',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : null}

              {selectedImageUrl ? (
                <div style={{ marginBottom: '8px' }}>
                  <div
                    style={{
                      position: 'relative',
                      width: '60px',
                      height: '60px',
                    }}
                  >
                    <img
                      src={selectedImageUrl}
                      alt="Selected attachment"
                      style={{
                        width: '60px',
                        height: '60px',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                      }}
                    />
                    <button
                      type="button"
                      aria-label="Remove selected image"
                      onClick={() => setSelectedImageUrl(null)}
                      style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-6px',
                        width: '18px',
                        height: '18px',
                        borderRadius: '999px',
                        border: '1px solid #fca5a5',
                        backgroundColor: '#ffffff',
                        color: '#dc2626',
                        fontSize: '14px',
                        fontWeight: 700,
                        lineHeight: '18px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        padding: 0,
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ) : null}

              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={messageInput}
                  onChange={(event) => setMessageInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') handleSendMessage()
                  }}
                  placeholder="Type your message..."
                  style={{
                    flex: 1,
                    padding: '12px 14px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '15px',
                    outline: 'none',
                  }}
                />
                <label
                  aria-label="Upload image"
                  title="Upload image"
                  style={{
                    width: '44px',
                    height: '44px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    backgroundColor: '#ffffff',
                    color: '#334155',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  <FiImage size={18} />
                  <input
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (!file) return
                      setSelectedImageUrl(URL.createObjectURL(file))
                      event.currentTarget.value = ''
                    }}
                  />
                </label>
                <button
                  type="button"
                  onClick={handleSendMessage}
                  style={{
                    padding: '12px 16px',
                    borderRadius: '8px',
                    border: '1px solid #0f766e',
                    backgroundColor: '#0f766e',
                    color: '#ffffff',
                    fontSize: '15px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Send
                </button>
              </div>
            </div>
          </section>
        </div>
      </FadeInOnScroll>
      </VendorMain>

      {previewImageUrl ? (
        <div
          onClick={() => setPreviewImageUrl(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1200,
            padding: '20px',
            cursor: 'zoom-out',
          }}
        >
          <img
            src={previewImageUrl}
            alt="Image preview"
            onClick={(event) => event.stopPropagation()}
            style={{
              maxWidth: '92vw',
              maxHeight: '88vh',
              borderRadius: '12px',
              boxShadow: '0 12px 36px rgba(0, 0, 0, 0.45)',
              backgroundColor: '#ffffff',
            }}
          />
        </div>
      ) : null}
    </VendorLayout>
  )
}

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

export default VendorMessage