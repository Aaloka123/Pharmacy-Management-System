import { api } from './api'

export type NotificationDto = {
  id: number
  orderId: number | null
  message: string
  productImage: string | null
  read: boolean
  createdAt: string
}

export async function fetchNotifications(): Promise<NotificationDto[]> {
  const { data } = await api.get<NotificationDto[]>('/api/notifications')
  return data
}

export async function fetchUnreadNotificationCount(): Promise<number> {
  const { data } = await api.get<{ count: number }>('/api/notifications/unread-count')
  return data.count
}

export async function markNotificationRead(id: number): Promise<void> {
  await api.post(`/api/notifications/${id}/read`)
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.post('/api/notifications/read-all')
}

export function formatNotificationTime(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  if (diffDay < 7) return `${diffDay}d ago`
  return date.toLocaleDateString()
}
