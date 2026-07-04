import { fetchConversations } from './messageApi'
import { fetchVendorOrders, type VendorOrderDto } from './orderApi'
import { listVendorProducts, type ProductDto } from './productsApi'
import { fetchVendorReviews, type ReviewDto } from './reviewApi'
import {
  ensureVendorNotificationBaseline,
  isProductExpired,
  markVendorOrderSeen,
  markVendorProductAlertSeen,
  markVendorReviewSeen,
  readSeenProductAlertKeys,
  readSeenIds,
  refreshVendorNavBadges,
  SEEN_PENDING_ORDERS_KEY,
  SEEN_UNREPLIED_REVIEWS_KEY,
  VENDOR_BADGES_REFRESH_EVENT,
  writeAllSeenProductAlertKeys,
  writeSeenIds,
} from './vendorNavBadges'

export { VENDOR_BADGES_REFRESH_EVENT }

export type VendorNotificationKind = 'order' | 'expired' | 'out_of_stock' | 'message' | 'review'

export type VendorNotification = {
  id: string
  kind: VendorNotificationKind
  message: string
  createdAt: string
  path: string
  unread: boolean
}

export function formatNotificationAgo(iso: string | null | undefined): string {
  if (!iso) return 'recently'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'recently'
  const diffMs = Date.now() - date.getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

function buildOrderNotifications(orders: VendorOrderDto[]): VendorNotification[] {
  const seenOrders = readSeenIds(SEEN_PENDING_ORDERS_KEY)
  return orders
    .filter((order) => order.status === 'PENDING')
    .map((order) => ({
      id: `order:${order.id}`,
      kind: 'order' as const,
      message: `New order from ${order.clientName} for ${order.productName} (qty ${order.quantity})`,
      createdAt: order.orderDate,
      path: '/vendororder',
      unread: !seenOrders.has(order.id),
    }))
}

function buildProductNotifications(products: ProductDto[]): VendorNotification[] {
  const seenAlerts = readSeenProductAlertKeys()
  const notifications: VendorNotification[] = []

  for (const product of products) {
    if (isProductExpired(product.expiryDate)) {
      const id = `expired:${product.id}`
      notifications.push({
        id,
        kind: 'expired',
        message: `${product.productName} has expired`,
        createdAt: product.updatedAt || product.createdAt,
        path: '/vendorproduct',
        unread: !seenAlerts.has(id),
      })
    }
    if (product.stock <= 0) {
      const id = `stock:${product.id}`
      notifications.push({
        id,
        kind: 'out_of_stock',
        message: `${product.productName} is out of stock`,
        createdAt: product.updatedAt || product.createdAt,
        path: '/vendorproduct',
        unread: !seenAlerts.has(id),
      })
    }
  }

  return notifications
}

function buildReviewNotifications(reviews: ReviewDto[]): VendorNotification[] {
  const seenReviews = readSeenIds(SEEN_UNREPLIED_REVIEWS_KEY)
  return reviews
    .filter((review) => !review.vendorReplyBody)
    .map((review) => ({
      id: `review:${review.id}`,
      kind: 'review' as const,
      message: `New review on ${review.productName} by ${review.author}`,
      createdAt: review.createdAt,
      path: '/vendorreview',
      unread: !seenReviews.has(review.id),
    }))
}

function buildMessageNotifications(
  conversations: Awaited<ReturnType<typeof fetchConversations>>,
): VendorNotification[] {
  return conversations
    .filter((conversation) => conversation.unreadCount > 0)
    .map((conversation) => ({
      id: `message:${conversation.id}`,
      kind: 'message' as const,
      message: `New message from ${conversation.peerName}`,
      createdAt: conversation.lastMessageAt || new Date().toISOString(),
      path: '/vendormessage',
      unread: true,
    }))
}

export async function fetchVendorNotifications(): Promise<VendorNotification[]> {
  const [orders, reviews, productsRes, conversations] = await Promise.all([
    fetchVendorOrders().catch(() => [] as VendorOrderDto[]),
    fetchVendorReviews().catch(() => [] as ReviewDto[]),
    listVendorProducts().catch(() => ({ data: [] as ProductDto[] })),
    fetchConversations().catch(() => []),
  ])

  ensureVendorNotificationBaseline(productsRes.data)

  const notifications = [
    ...buildOrderNotifications(orders),
    ...buildProductNotifications(productsRes.data),
    ...buildMessageNotifications(conversations),
    ...buildReviewNotifications(reviews),
  ]

  return notifications.sort(
    (left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  )
}

export function countUnreadVendorNotifications(notifications: VendorNotification[]): number {
  return notifications.filter((notification) => notification.unread).length
}

export function markVendorNotificationSeen(notification: VendorNotification) {
  if (notification.kind === 'order') {
    const orderId = Number(notification.id.replace('order:', ''))
    if (Number.isFinite(orderId)) markVendorOrderSeen(orderId)
    return
  }
  if (notification.kind === 'review') {
    const reviewId = Number(notification.id.replace('review:', ''))
    if (Number.isFinite(reviewId)) markVendorReviewSeen(reviewId)
    return
  }
  if (notification.kind === 'message') {
    refreshVendorNavBadges()
    return
  }
  markVendorProductAlertSeen(notification.id)
}

export function markAllVendorNotificationsSeen(notifications: VendorNotification[]) {
  const seenOrders = readSeenIds(SEEN_PENDING_ORDERS_KEY)
  const seenReviews = readSeenIds(SEEN_UNREPLIED_REVIEWS_KEY)
  const seenAlerts = readSeenProductAlertKeys()

  for (const notification of notifications) {
    if (notification.kind === 'order') {
      const orderId = Number(notification.id.replace('order:', ''))
      if (Number.isFinite(orderId)) seenOrders.add(orderId)
    } else if (notification.kind === 'review') {
      const reviewId = Number(notification.id.replace('review:', ''))
      if (Number.isFinite(reviewId)) seenReviews.add(reviewId)
    } else if (notification.kind === 'expired' || notification.kind === 'out_of_stock') {
      seenAlerts.add(notification.id)
    }
  }

  writeSeenIds(SEEN_PENDING_ORDERS_KEY, [...seenOrders])
  writeSeenIds(SEEN_UNREPLIED_REVIEWS_KEY, [...seenReviews])
  writeAllSeenProductAlertKeys([...seenAlerts])
  refreshVendorNavBadges()
}

export function refreshVendorNotifications() {
  refreshVendorNavBadges()
}
