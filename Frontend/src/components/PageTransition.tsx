import { useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'

type PageTransitionProps = {
  children: ReactNode
}

export default function PageTransition({ children }: PageTransitionProps) {
  const { pathname } = useLocation()

  return (
    <div className="page-transition" key={pathname}>
      {children}
    </div>
  )
}
