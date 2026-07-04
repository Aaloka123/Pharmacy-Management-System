import ScrollLockPortal from './ScrollLockPortal'

type ImageLightboxProps = {
  imageUrl: string
  alt: string
  onClose: () => void
}

const ImageLightbox = ({ imageUrl, alt, onClose }: ImageLightboxProps) => {
  return (
    <ScrollLockPortal aria-label="Image preview" className="bg-slate-900/75" onClose={onClose}>
      <button
        aria-label="Close preview"
        className="fixed right-5 top-5 z-[10000] flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white text-slate-800 shadow-lg transition hover:bg-slate-100"
        onClick={onClose}
        type="button"
      >
        <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path d="M6 18 18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="flex h-dvh max-h-dvh w-full items-center justify-center p-4">
        <div className="rounded-2xl bg-white p-4 shadow-2xl" onClick={(event) => event.stopPropagation()}>
          <img
            alt={alt}
            className="block max-h-[calc(100dvh-8rem)] max-w-[min(480px,calc(100vw-2rem))] object-contain"
            draggable={false}
            src={imageUrl}
          />
        </div>
      </div>
    </ScrollLockPortal>
  )
}

export default ImageLightbox
