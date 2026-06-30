import { useEffect } from 'react'

type ImageLightboxProps = {
  imageUrl: string
  alt: string
  onClose: () => void
}

const ImageLightbox = ({ imageUrl, alt, onClose }: ImageLightboxProps) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return (
    <div
      aria-label="Image preview"
      aria-modal="true"
      className="fixed inset-0 z-50 flex cursor-default items-center justify-center bg-slate-900/75 p-4"
      onClick={onClose}
      role="dialog"
    >
      <button
        aria-label="Close preview"
        className="absolute right-4 top-4 cursor-pointer rounded-full border border-white/30 bg-slate-900/50 p-2 text-white transition hover:bg-slate-900/80"
        onClick={onClose}
        type="button"
      >
        <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
          <path d="M6 18 18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <img
        alt={alt}
        className="max-h-[90vh] max-w-[92vw] rounded-xl object-contain shadow-2xl"
        draggable={false}
        onClick={(event) => event.stopPropagation()}
        src={imageUrl}
      />
    </div>
  )
}

export default ImageLightbox
