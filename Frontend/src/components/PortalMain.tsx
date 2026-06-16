import type { ReactNode } from 'react'

type PortalMainProps = {
  children: ReactNode
  className?: string
}

export function AdminMain({ children, className = 'flex-1 p-6' }: PortalMainProps) {
  return <main className={className}>{children}</main>
}

export function VendorMain({ children, className = 'flex-1 p-6' }: PortalMainProps) {
  return <main className={className}>{children}</main>
}

export { default as FadeInOnScroll } from './FadeInOnScroll'
