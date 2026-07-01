import { Client, type IMessage } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { getAccessToken } from './auth'

function resolveWsUrl(): string {
  const path = '/ws'
  const envApiBase =
    typeof import.meta.env.VITE_API_BASE_URL === 'string'
      ? import.meta.env.VITE_API_BASE_URL.trim().replace(/\/$/, '')
      : ''
  if (envApiBase) {
    return `${envApiBase}${path}`
  }
  if (import.meta.env.DEV && typeof window !== 'undefined') {
    return `${window.location.origin}${path}`
  }
  return path
}

export function createChatClient(onConnect?: () => void, onDisconnect?: () => void): Client {
  return new Client({
    webSocketFactory: () => new SockJS(resolveWsUrl()) as WebSocket,
    connectHeaders: {
      Authorization: `Bearer ${getAccessToken() ?? ''}`,
    },
    reconnectDelay: 5000,
    heartbeatIncoming: 10000,
    heartbeatOutgoing: 10000,
    onConnect,
    onDisconnect,
  })
}

export function subscribeToConversation(
  client: Client,
  conversationId: number,
  onMessage: (message: IMessage) => void,
) {
  return client.subscribe(`/topic/conversation.${conversationId}`, onMessage)
}

export function sendChatMessage(
  client: Client,
  conversationId: number,
  message: {
    body?: string | null
    attachmentUrl?: string | null
    attachmentName?: string | null
    attachmentMimeType?: string | null
    replyToMessageId?: number | null
  },
) {
  client.publish({
    destination: '/app/chat.send',
    body: JSON.stringify({ conversationId, message }),
  })
}
