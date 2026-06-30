import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { fetchVendorOrders } from './orderApi'
import { listVendorProducts, type ProductDto } from './productsApi'
import { fetchVendorReviews } from './reviewApi'
import { getStoredUser, onAuthChange } from './auth'

const SEEN_PENDING_ORDERS_KEY = 'vendorSeenPendingOrderIds'
const SEEN_UNREPLIED_REVIEWS_KEY = 'vendorSeenUnrepliedReviewIds'
export const VENDOR_BADGES_REFRESH_EVENT = 'vendor-badges-refresh'

export function getProductExpiryStatus(expiryDate: string): { label: string; classes: string } {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const expDate = new Date(expiryDate)
  if (Number.isNaN(expDate.getTime())) {
    return { label: 'Unknown', classes: 'bg-slate-100 text-slate-700' }
  }
  expDate.setHours(0, 0, 0, 0)

  if (expDate < today) {
    return { label: 'Expired', classes: 'bg-rose-100 text-rose-700' }
  }
  if (expDate.getTime() === today.getTime()) {
    return { label: 'Expires Today', classes: 'bg-amber-100 text-amber-700' }
  }
  return { label: 'Valid', classes: 'bg-emerald-100 text-emerald-700' }
}

export function isProductExpired(expiryDate: string): boolean {
  return getProductExpiryStatus(expiryDate).label === 'Expired'
}

export function countProductAlerts(products: ProductDto[]): number {
  return products.filter((product) => isProductExpired(product.expiryDate) || product.stock <= 0).length
}

export type VendorNavBadges = {
  message: number
  product: number
  order: number
  review: number
}

const DEFAULT_BADGES: VendorNavBadges = {
  message: 1,
  product: 0,
  order: 0,
  review: 0,
}

function storageKey(base: string): string {
  const vendorId = getStoredUser()?.id
  return vendorId != null ? `${base}:${vendorId}` : base
}

function readSeenIds(base: string): Set<number> {
  try {
    const raw = localStorage.getItem(storageKey(base))
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as number[]
    return new Set(parsed.filter((id) => Number.isFinite(id)))
  } catch {
    return new Set()
  }
}

function writeSeenIds(base: string, ids: number[]) {
  localStorage.setItem(storageKey(base), JSON.stringify(ids))
}

export function markVendorOrdersViewed(pendingOrderIds: number[]) {
  writeSeenIds(SEEN_PENDING_ORDERS_KEY, pendingOrderIds)
  refreshVendorNavBadges()
}

export function markVendorReviewsViewed(unrepliedReviewIds: number[]) {
  writeSeenIds(SEEN_UNREPLIED_REVIEWS_KEY, unrepliedReviewIds)
  refreshVendorNavBadges()
}

export function refreshVendorNavBadges() {
  window.dispatchEvent(new Event(VENDOR_BADGES_REFRESH_EVENT))
}

export async function fetchVendorNavBadges(): Promise<VendorNavBadges> {
  const [orders, reviews, productsRes] = await Promise.all([
    fetchVendorOrders().catch(() => []),
    fetchVendorReviews().catch(() => []),
    listVendorProducts().catch(() => ({ data: [] as ProductDto[] })),
  ])

  const seenPendingOrders = readSeenIds(SEEN_PENDING_ORDERS_KEY)
  const seenUnrepliedReviews = readSeenIds(SEEN_UNREPLIED_REVIEWS_KEY)

  const pendingOrders = orders.filter((order) => order.status === 'PENDING')
  const unrepliedReviews = reviews.filter((review) => !review.vendorReplyBody)

  return {
    message: 1,
    order: pendingOrders.filter((order) => !seenPendingOrders.has(order.id)).length,
    review: unrepliedReviews.filter((review) => !seenUnrepliedReviews.has(review.id)).length,
    product: countProductAlerts(productsRes.data),
  }
}

export function useVendorNavBadges(): VendorNavBadges {
  const location = useLocation()
  const [badges, setBadges] = useState<VendorNavBadges>(DEFAULT_BADGES)

  useEffect(() => {
    if (getStoredUser()?.role !== 'VENDOR') {
      setBadges(DEFAULT_BADGES)
      return undefined
    }

    let cancelled = false

    const load = async () => {
      try {
        const next = await fetchVendorNavBadges()
        if (location.pathname === '/vendororder') {
          next.order = 0
        }
        if (location.pathname === '/vendorreview') {
          next.review = 0
        }
        if (!cancelled) setBadges(next)
      } catch {
        // keep last known counts
      }
    }

    void load()
    const interval = window.setInterval(() => void load(), 30_000)
    const unsubscribe = onAuthChange(() => void load())
    const onRefresh = () => void load()
    window.addEventListener(VENDOR_BADGES_REFRESH_EVENT, onRefresh)

    return () => {
      cancelled = true
      window.clearInterval(interval)
      unsubscribe()
      window.removeEventListener(VENDOR_BADGES_REFRESH_EVENT, onRefresh)
    }
  }, [location.pathname])

  return badges
}
