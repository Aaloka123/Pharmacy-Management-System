import { api } from './api'
import type { ProductDto } from './productsApi'

export type MessageSenderType = 'USER' | 'VENDOR'

export type ConversationDto = {
  id: number
  peerId: number
  peerName: string
  peerProfileImage: string | null
  lastMessagePreview: string | null
  lastMessageAt: string | null
  unreadCount: number
  pinned: boolean
  muted: boolean
  blocked: boolean
}

export type UpdateConversationSettingsPayload = {
  pinned?: boolean
  muted?: boolean
  blocked?: boolean
  hidden?: boolean
}

export type ChatMessageDto = {
  id: number
  conversationId: number
  senderType: MessageSenderType
  senderId: number
  body: string | null
  attachmentUrl: string | null
  attachmentName: string | null
  attachmentMimeType: string | null
  attachmentKind: 'image' | 'pdf' | 'file' | null
  replyToMessageId: number | null
  createdAt: string
  deleted?: boolean
}

export type SendMessagePayload = {
  body?: string | null
  attachmentUrl?: string | null
  attachmentName?: string | null
  attachmentMimeType?: string | null
  replyToMessageId?: number | null
}

export type AttachmentUploadDto = {
  url: string
  fileName: string
  mimeType: string
  kind: 'image' | 'pdf' | 'file'
}

export async function fetchConversations(): Promise<ConversationDto[]> {
  const { data } = await api.get<ConversationDto[]>('/api/messages/conversations')
  return data ?? []
}

export async function createConversation(vendorId: number): Promise<ConversationDto> {
  const { data } = await api.post<ConversationDto>('/api/messages/conversations', { vendorId })
  return data
}

export async function fetchMessages(conversationId: number): Promise<ChatMessageDto[]> {
  const { data } = await api.get<ChatMessageDto[]>(`/api/messages/conversations/${conversationId}/messages`)
  return data ?? []
}

export async function sendMessageRest(
  conversationId: number,
  payload: SendMessagePayload,
): Promise<ChatMessageDto> {
  const { data } = await api.post<ChatMessageDto>(
    `/api/messages/conversations/${conversationId}/messages`,
    payload,
  )
  return data
}

export async function uploadMessageAttachment(
  conversationId: number,
  file: File,
): Promise<AttachmentUploadDto> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post<AttachmentUploadDto>(
    `/api/messages/conversations/${conversationId}/attachments`,
    form,
  )
  return data
}

export async function markConversationRead(conversationId: number): Promise<void> {
  await api.post(`/api/messages/conversations/${conversationId}/read`)
}

export async function markConversationUnread(conversationId: number): Promise<void> {
  await api.post(`/api/messages/conversations/${conversationId}/unread`)
}

export async function updateConversationSettings(
  conversationId: number,
  payload: UpdateConversationSettingsPayload,
): Promise<ConversationDto> {
  const { data } = await api.patch<ConversationDto>(
    `/api/messages/conversations/${conversationId}/settings`,
    payload,
  )
  return data
}

export async function fetchUnreadMessageCount(): Promise<number> {
  const { data } = await api.get<{ count: number }>('/api/messages/unread-count')
  return data?.count ?? 0
}

export async function deleteMessageForMe(conversationId: number, messageId: number): Promise<void> {
  await api.delete(`/api/messages/conversations/${conversationId}/messages/${messageId}/me`)
}

export async function deleteMessageForEveryone(conversationId: number, messageId: number): Promise<void> {
  await api.delete(`/api/messages/conversations/${conversationId}/messages/${messageId}/everyone`)
}

function guessImageMimeType(url: string): string {
  const lower = url.toLowerCase()
  if (lower.includes('.png')) return 'image/png'
  if (lower.includes('.webp')) return 'image/webp'
  if (lower.includes('.gif')) return 'image/gif'
  return 'image/jpeg'
}

export async function sendProductInquiry(product: ProductDto): Promise<ConversationDto> {
  const conversation = await createConversation(product.vendorId)
  const imageRef = product.images?.[0] ?? null
  const body = [
    `Product inquiry: ${product.productName}`,
    `SKU: ${product.sku}`,
    `Strength: ${product.strength} | Form: ${product.form}`,
    `Price: NRP ${Number(product.price).toLocaleString()}`,
    '',
    'Hi, I would like to inquire about this medicine. Please share availability and any details.',
  ].join('\n')

  await sendMessageRest(conversation.id, {
    body,
    attachmentUrl: imageRef,
    attachmentName: `${product.productName} product photo`,
    attachmentMimeType: imageRef ? guessImageMimeType(imageRef) : null,
  })

  return {
    ...conversation,
    lastMessagePreview: `Inquiry: ${product.productName}`,
    pinned: conversation.pinned ?? false,
    muted: conversation.muted ?? false,
    blocked: conversation.blocked ?? false,
  }
}
