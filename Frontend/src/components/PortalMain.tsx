import type { ReactNode } from 'react'

type PortalMainProps = {
  children: ReactNode
  className?: string
}

export function AdminMain({ children, className = 'flex-1 p-4 md:p-6' }: PortalMainProps) {
  return <main className={`min-w-0 flex-1 ${className}`}>{children}</main>
}

export function VendorMain({ children, className = 'flex-1 p-4 md:p-6' }: PortalMainProps) {
  return <main className={`min-w-0 flex-1 ${className}`}>{children}</main>
}

export function AdminLayout({ children }: PortalMainProps) {
  return <div className="flex min-h-screen flex-col bg-slate-50 lg:flex-row">{children}</div>
}

export function VendorLayout({ children }: PortalMainProps) {
  return <div className="flex min-h-screen flex-col bg-slate-50 lg:flex-row">{children}</div>
}

export { default as FadeInOnScroll } from './FadeInOnScroll'
