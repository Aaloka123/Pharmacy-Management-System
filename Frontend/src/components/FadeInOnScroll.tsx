import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'

type FadeInOnScrollProps = {
  children: ReactNode
  className?: string
  delay?: number
}

export default function FadeInOnScroll({ children, className = '', delay = 0 }: FadeInOnScrollProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setVisible(true)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  const style: CSSProperties | undefined = delay > 0 ? { transitionDelay: `${delay}ms` } : undefined

  return (
    <div
      ref={ref}
      className={`scroll-fade-in${visible ? ' is-visible' : ''}${className ? ` ${className}` : ''}`}
      style={style}
    >
      {children}
    </div>
  )
}
