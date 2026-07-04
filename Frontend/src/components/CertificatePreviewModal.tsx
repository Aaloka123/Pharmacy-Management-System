import ScrollLockPortal from './ScrollLockPortal'

type CertificatePreviewModalProps = {
  title: string
  src: string
  onClose: () => void
  onPrint: () => void
  onDownload: () => void
}

const CertificatePreviewModal = ({
  title,
  src,
  onClose,
  onPrint,
  onDownload,
}: CertificatePreviewModalProps) => {
  return (
    <ScrollLockPortal aria-label="Certificate preview" className="bg-slate-900/60 p-4" onClose={onClose}>
      <div className="flex h-dvh max-h-dvh w-full items-center justify-center">
        <div
          className="flex max-h-[calc(100dvh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white p-5 shadow-2xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-4 flex shrink-0 items-center justify-between gap-3">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <button
              aria-label="Close preview"
              className="cursor-pointer rounded-md border border-slate-300 p-2 text-slate-700"
              onClick={onClose}
              type="button"
            >
              <svg className="size-4" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
                <path d="M6 18 18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-3">
            <img
              alt={title}
              className="mx-auto block max-h-[calc(100dvh-14rem)] w-full rounded-md border border-slate-200 object-contain"
              draggable={false}
              src={src}
            />
          </div>

          <div className="mt-4 flex shrink-0 gap-3">
            <button
              className="cursor-pointer rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white"
              onClick={onPrint}
              type="button"
            >
              Print
            </button>
            <button
              className="cursor-pointer rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
              onClick={onDownload}
              type="button"
            >
              Download
            </button>
          </div>
        </div>
      </div>
    </ScrollLockPortal>
  )
}

export default CertificatePreviewModal
