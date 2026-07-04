import type { ReactNode } from 'react'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

type ScrollLockPortalProps = {
  children: ReactNode
  className?: string
  onClose?: () => void
  'aria-label'?: string
}

const ScrollLockPortal = ({
  children,
  className = '',
  onClose,
  'aria-label': ariaLabel = 'Dialog',
}: ScrollLockPortalProps) => {
  const onCloseRef = useRef(onClose)
  onCloseRef.current = onClose

  useEffect(() => {
    const scrollY = window.scrollY
    const previousBodyOverflow = document.body.style.overflow
    const previousBodyPosition = document.body.style.position
    const previousBodyTop = document.body.style.top
    const previousBodyLeft = document.body.style.left
    const previousBodyRight = document.body.style.right
    const previousBodyWidth = document.body.style.width
    const previousHtmlOverflow = document.documentElement.style.overflow

    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.width = '100%'
    document.documentElement.style.overflow = 'hidden'

    const preventScroll = (event: Event) => {
      event.preventDefault()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCloseRef.current?.()
    }

    document.addEventListener('keydown', handleKeyDown)
    document.addEventListener('wheel', preventScroll, { passive: false })
    document.addEventListener('touchmove', preventScroll, { passive: false })

    return () => {
      document.body.style.overflow = previousBodyOverflow
      document.body.style.position = previousBodyPosition
      document.body.style.top = previousBodyTop
      document.body.style.left = previousBodyLeft
      document.body.style.right = previousBodyRight
      document.body.style.width = previousBodyWidth
      document.documentElement.style.overflow = previousHtmlOverflow
      window.scrollTo(0, scrollY)

      document.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('wheel', preventScroll)
      document.removeEventListener('touchmove', preventScroll)
    }
  }, [])

  return createPortal(
    <div
      aria-label={ariaLabel}
      aria-modal="true"
      className={`fixed inset-0 z-[9999] overflow-hidden overscroll-none ${className}`.trim()}
      onClick={onClose}
      role="dialog"
    >
      {children}
    </div>,
    document.body,
  )
}

export default ScrollLockPortal
