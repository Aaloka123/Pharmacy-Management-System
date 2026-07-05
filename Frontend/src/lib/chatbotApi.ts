import { api, resolveMediaUrl } from './api'

export type ChatbotProductCard = {
  id: number
  productName: string
  vendorBusinessName: string
  price: number
  stock: number
  category: string
  imageUrl: string | null
}

export type StoredChatbotMessage = {
  id: number
  role: 'user' | 'assistant'
  body: string
  createdAt: string
  products?: ChatbotProductCard[]
}

export type ChatbotSendResponse = {
  reply: string
  products: ChatbotProductCard[]
  userMessageId: number
  assistantMessageId: number
  userCreatedAt: string
  assistantCreatedAt: string
}

function mapProductCard(product: ChatbotProductCard): ChatbotProductCard {
  return {
    ...product,
    price: Number(product.price),
    stock: Number(product.stock),
    imageUrl: product.imageUrl ? resolveMediaUrl(product.imageUrl) : null,
  }
}

export async function fetchChatbotMessages(): Promise<StoredChatbotMessage[]> {
  const { data } = await api.get<StoredChatbotMessage[]>('/api/chatbot/messages')
  return (data ?? []).map((message) => ({
    ...message,
    products: (message.products ?? []).map(mapProductCard),
  }))
}

export async function sendChatbotMessage(message: string): Promise<ChatbotSendResponse> {
  const { data } = await api.post<ChatbotSendResponse>('/api/chatbot/message', { message })
  return {
    reply: data.reply,
    products: (data.products ?? []).map(mapProductCard),
    userMessageId: data.userMessageId,
    assistantMessageId: data.assistantMessageId,
    userCreatedAt: data.userCreatedAt,
    assistantCreatedAt: data.assistantCreatedAt,
  }
}
