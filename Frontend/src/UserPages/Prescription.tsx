import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react'
import { FiClock, FiExternalLink, FiImage, FiLoader, FiPlus, FiTrash2, FiUploadCloud } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import Copyright from '../UserComponents/Copyright'
import Footer from '../UserComponents/Footer'
import Header from '../UserComponents/Header'
import FadeInOnScroll from '../components/FadeInOnScroll'
import { usePublicProducts } from '../hooks/usePublicProducts'
import {
  fetchMyPrescriptions,
  fetchPrescription,
  deletePrescription,
  scanPrescriptionImage,
  type PrescriptionRecord,
  type PrescriptionSummary,
} from '../lib/prescriptionApi'
import type { ProductDto } from '../lib/productsApi'

function normalizeMedicineName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function findShopProduct(medicineName: string, products: ProductDto[]): ProductDto | null {
  const needle = normalizeMedicineName(medicineName)
  if (needle.length < 3) return null

  const exact = products.find((product) => normalizeMedicineName(product.productName) === needle)
  if (exact) return exact

  const matches = products.filter((product) => {
    const name = normalizeMedicineName(product.productName)
    if (!name) return false
    return name.includes(needle) || needle.includes(name)
  })

  if (matches.length === 0) return null
  matches.sort((a, b) => a.productName.length - b.productName.length)
  return matches[0]
}

const ACCEPTED_IMAGES = 'image/jpeg,image/png,image/webp,image/gif'

type ScanButtonProps = {
  scanning: boolean
  label: string
  onClick: () => void
}

const ScanButton = ({ scanning, label, onClick }: ScanButtonProps) => (
  <button
    className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
    disabled={scanning}
    onClick={onClick}
    type="button"
  >
    {scanning ? <FiLoader aria-hidden className="h-4 w-4 animate-spin" /> : null}
    <span>{scanning ? 'Scanning…' : label}</span>
  </button>
)

function formatScanDate(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Unknown date'
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

const Prescription = () => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { products: shopProducts } = usePublicProducts()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<PrescriptionRecord | null>(null)
  const [history, setHistory] = useState<PrescriptionSummary[]>([])
  const [historyLoading, setHistoryLoading] = useState(true)
  const [selectedHistoryId, setSelectedHistoryId] = useState<number | null>(null)
  const [loadingHistoryItem, setLoadingHistoryItem] = useState(false)
  const [deletingHistoryId, setDeletingHistoryId] = useState<number | null>(null)
  const [viewingFromHistory, setViewingFromHistory] = useState(false)

  const medicineShopMatches = useMemo(() => {
    const map = new Map<number, ProductDto>()
    if (!result?.medicines.length) return map
    result.medicines.forEach((medicine, index) => {
      const match = findShopProduct(medicine.name, shopProducts)
      if (match) map.set(index, match)
    })
    return map
  }, [result, shopProducts])

  const revokeBlobPreview = (url: string | null) => {
    if (url?.startsWith('blob:')) {
      URL.revokeObjectURL(url)
    }
  }

  const loadHistory = async () => {
    try {
      const items = await fetchMyPrescriptions()
      setHistory(items)
    } catch {
      setHistory([])
      toast.error('Could not load prescription history.')
    } finally {
      setHistoryLoading(false)
    }
  }

  useEffect(() => {
    void loadHistory()
  }, [])

  const resetPreview = () => {
    revokeBlobPreview(previewUrl)
    setPreviewUrl(null)
    setSelectedFile(null)
    setResult(null)
    setSelectedHistoryId(null)
    setViewingFromHistory(false)
  }

  const handleNewPrescription = () => {
    resetPreview()
  }

  const applyRecord = (record: PrescriptionRecord) => {
    revokeBlobPreview(previewUrl)
    setSelectedFile(null)
    setPreviewUrl(record.imageUrl)
    setResult(record)
    setSelectedHistoryId(record.id)
  }

  const handleHistorySelect = async (item: PrescriptionSummary) => {
    if (loadingHistoryItem || selectedHistoryId === item.id) return

    setLoadingHistoryItem(true)
    try {
      const record = await fetchPrescription(item.id)
      setViewingFromHistory(true)
      applyRecord(record)
    } catch {
      toast.error('Could not load this prescription.')
    } finally {
      setLoadingHistoryItem(false)
    }
  }

  const handleHistoryDelete = async (item: PrescriptionSummary) => {
    if (deletingHistoryId != null) return

    const confirmed = window.confirm(
      'Delete this prescription scan? It will be permanently removed from your history.',
    )
    if (!confirmed) return

    setDeletingHistoryId(item.id)
    try {
      await deletePrescription(item.id)
      setHistory((prev) => prev.filter((entry) => entry.id !== item.id))
      if (selectedHistoryId === item.id) {
        resetPreview()
      }
      toast.success('Prescription removed from history.')
    } catch {
      toast.error('Could not delete this prescription.')
    } finally {
      setDeletingHistoryId(null)
    }
  }

  const handleFilePick = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload a prescription photo (JPEG, PNG, WEBP, or GIF).')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be 10 MB or smaller.')
      return
    }

    revokeBlobPreview(previewUrl)
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setResult(null)
    setSelectedHistoryId(null)
    setViewingFromHistory(false)
  }

  const handleScan = async () => {
    if (!selectedFile || scanning) return

    setScanning(true)
    try {
      const scanned = await scanPrescriptionImage(selectedFile)
      applyRecord(scanned)
      await loadHistory()
      if (!scanned.fullText.trim() && scanned.medicines.length === 0) {
        toast.info('No readable text was found. Try a clearer photo with good lighting.')
      } else {
        toast.success('Prescription scanned and saved.')
      }
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Could not read the prescription. Make sure Ollama is running with llava:7b.'
      toast.error(message)
    } finally {
      setScanning(false)
    }
  }

  const showResults = Boolean(result && previewUrl)
  const viewingHistory = viewingFromHistory && selectedHistoryId != null

  return (
    <div className="bg-white">
      <Header />
      <main className="bg-white px-4 pb-10 pt-4 md:px-8 lg:px-[80px]">
        <section className="mx-auto w-full max-w-7xl">
          <FadeInOnScroll>
            <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
              <aside className="w-full shrink-0 lg:w-72">
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-slate-900">
                      <FiClock className="h-4 w-4 text-teal-700" />
                      <h2 className="text-sm font-bold uppercase tracking-wide">Scan history</h2>
                    </div>
                    <button
                      aria-label="New prescription"
                      className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-teal-700 transition hover:border-teal-300 hover:bg-teal-50"
                      onClick={handleNewPrescription}
                      title="New prescription"
                      type="button"
                    >
                      <FiPlus aria-hidden className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Your saved prescription scans</p>

                  {historyLoading ? (
                    <p className="mt-4 text-sm text-slate-500">Loading history…</p>
                  ) : history.length === 0 ? (
                    <p className="mt-4 text-sm text-slate-500">No scans yet. Upload and scan your first prescription.</p>
                  ) : (
                    <ul className="mt-4 space-y-2">
                      {history.map((item) => {
                        const active = selectedHistoryId === item.id
                        const deleting = deletingHistoryId === item.id
                        return (
                          <li className="group relative" key={item.id}>
                            <button
                              className={`flex w-full cursor-pointer items-start gap-3 rounded-xl border p-2.5 pr-10 text-left transition ${
                                active
                                  ? 'border-teal-300 bg-white shadow-sm'
                                  : 'border-transparent bg-white/70 hover:border-slate-200 hover:bg-white'
                              }`}
                              disabled={loadingHistoryItem || deleting}
                              onClick={() => void handleHistorySelect(item)}
                              type="button"
                            >
                              <img
                                alt=""
                                className="h-14 w-14 shrink-0 rounded-lg border border-slate-200 object-cover"
                                src={item.imageUrl}
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-xs font-semibold text-slate-900">
                                  {formatScanDate(item.createdAt)}
                                </span>
                                <span className="mt-1 line-clamp-2 text-xs text-slate-600">{item.previewText}</span>
                                {item.medicineCount > 0 ? (
                                  <span className="mt-1 inline-block text-[11px] font-medium text-teal-700">
                                    {item.medicineCount} medicine{item.medicineCount === 1 ? '' : 's'}
                                  </span>
                                ) : null}
                              </span>
                            </button>
                            <button
                              aria-label="Delete prescription scan"
                              className="absolute right-2 top-2 inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-transparent text-slate-400 opacity-0 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 focus:opacity-100 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-50"
                              disabled={deleting}
                              onClick={(event) => {
                                event.stopPropagation()
                                void handleHistoryDelete(item)
                              }}
                              title="Delete scan"
                              type="button"
                            >
                              {deleting ? (
                                <FiLoader aria-hidden className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <FiTrash2 aria-hidden className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              </aside>

              <div className="min-w-0 flex-1">
                <div>
                  <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-[30px]">
                    {viewingHistory ? 'Prescription scan' : 'New Prescription'}
                  </h1>
                  {!viewingHistory ? (
                    <p className="mt-3 text-sm text-slate-600 md:text-base">
                      Upload a photo first. Nothing is read until you click{' '}
                      <span className="font-semibold">Scan with AI</span>. Each scan is saved to your history.
                    </p>
                  ) : null}
                </div>

                <div className={`mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-8 ${showResults ? 'hidden' : ''}`}>
                  <input
                    accept={ACCEPTED_IMAGES}
                    className="hidden"
                    onChange={handleFilePick}
                    ref={fileInputRef}
                    type="file"
                  />

                  {!previewUrl ? (
                    <button
                      className="flex w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white px-6 py-12 text-center transition hover:border-teal-500 hover:bg-teal-50/40"
                      onClick={() => fileInputRef.current?.click()}
                      type="button"
                    >
                      <FiUploadCloud className="h-10 w-10 text-teal-700" />
                      <span className="mt-4 text-base font-semibold text-slate-900">Upload prescription photo</span>
                      <span className="mt-2 text-sm text-slate-500">
                        Take a clear photo of handwritten prescription text
                      </span>
                      <span className="mt-1 text-xs text-slate-400">JPEG, PNG, WEBP, or GIF · Max 10 MB</span>
                    </button>
                  ) : (
                    <div className="space-y-5">
                      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                        <img
                          alt="Prescription preview"
                          className="max-h-[420px] w-full object-contain"
                          src={previewUrl}
                        />
                      </div>

                      <p className="text-xs text-slate-500">
                        {scanning
                          ? 'Scanning in progress. Keep this tab open and make sure Ollama is running. This may take 1–5 minutes.'
                          : 'Review your photo, then click Scan with AI when you are ready.'}
                      </p>

                      <div className="flex flex-wrap gap-3">
                        {selectedFile ? (
                          <ScanButton
                            label="Scan with AI"
                            onClick={() => void handleScan()}
                            scanning={scanning}
                          />
                        ) : null}
                        <button
                          className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                          onClick={() => fileInputRef.current?.click()}
                          type="button"
                        >
                          <FiImage className="h-4 w-4" />
                          Change photo
                        </button>
                        <button
                          className="inline-flex cursor-pointer items-center rounded-full px-5 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-100"
                          onClick={resetPreview}
                          type="button"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {showResults ? (
                  <div className="mt-8 space-y-6">
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
                      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Original prescription
                      </p>
                      <img
                        alt="Prescription preview"
                        className="mx-auto max-h-[min(70vh,560px)] w-full object-contain"
                        src={previewUrl}
                      />
                    </div>

                    {(selectedFile || !viewingHistory) && showResults ? (
                      <div className="flex flex-wrap gap-3">
                        {selectedFile ? (
                          <ScanButton
                            label="Scan again"
                            onClick={() => void handleScan()}
                            scanning={scanning}
                          />
                        ) : null}
                        {selectedFile ? (
                          <button
                            className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                            onClick={() => fileInputRef.current?.click()}
                            type="button"
                          >
                            <FiImage className="h-4 w-4" />
                            Change photo
                          </button>
                        ) : null}
                      </div>
                    ) : null}

                    {result?.doctorNotes ? (
                      <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
                        <h2 className="text-lg font-semibold text-slate-900">Notes</h2>
                        <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{result.doctorNotes}</p>
                      </div>
                    ) : null}

                    {result && result.medicines.length > 0 ? (
                      <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
                        <h2 className="text-lg font-semibold text-slate-900">Medicines found</h2>
                        <div className="mt-4 overflow-x-auto">
                          <table className="min-w-full text-left text-sm">
                            <thead>
                              <tr className="border-b border-slate-200 text-slate-500">
                                <th className="px-3 py-2 font-medium">Medicine</th>
                                <th className="px-3 py-2 font-medium">Dosage</th>
                                <th className="px-3 py-2 font-medium">Frequency</th>
                                <th className="px-3 py-2 font-medium">Duration</th>
                                <th className="px-3 py-2 font-medium">Shop</th>
                              </tr>
                            </thead>
                            <tbody>
                              {result.medicines.map((medicine, index) => {
                                const shopProduct = medicineShopMatches.get(index)
                                return (
                                  <tr className="border-b border-slate-100" key={`${medicine.name}-${index}`}>
                                    <td className="px-3 py-3 font-medium text-slate-900">
                                      {shopProduct ? (
                                        <Link
                                          className="text-teal-700 underline decoration-teal-300 underline-offset-2 transition hover:text-teal-800"
                                          to={`/productsdetail?id=${shopProduct.id}`}
                                        >
                                          {medicine.name}
                                        </Link>
                                      ) : (
                                        medicine.name
                                      )}
                                    </td>
                                    <td className="px-3 py-3 text-slate-700">{medicine.dosage || '—'}</td>
                                    <td className="px-3 py-3 text-slate-700">{medicine.frequency || '—'}</td>
                                    <td className="px-3 py-3 text-slate-700">{medicine.duration || '—'}</td>
                                    <td className="px-3 py-3">
                                      {shopProduct ? (
                                        <Link
                                          className="inline-flex items-center gap-1.5 font-semibold text-teal-700 transition hover:text-teal-800"
                                          to={`/productsdetail?id=${shopProduct.id}`}
                                        >
                                          View product
                                          <FiExternalLink aria-hidden className="h-3.5 w-3.5" />
                                        </Link>
                                      ) : (
                                        <span className="text-slate-400">Not in shop</span>
                                      )}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : null}

                    <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
                      <h2 className="text-lg font-semibold text-slate-900">Extracted text</h2>
                      <p className="mt-3 whitespace-pre-wrap font-mono text-sm leading-6 text-slate-700">
                        {result?.fullText || 'No text extracted.'}
                      </p>
                    </div>

                    <div className="rounded-2xl border border-teal-100 bg-teal-50 px-5 py-4 text-sm text-teal-900">
                      Compare the extracted text with your photo above. AI may misread handwriting — verify before ordering.{' '}
                      <Link className="font-semibold underline" to="/products">
                        Browse products
                      </Link>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </FadeInOnScroll>
        </section>
      </main>
      <Footer />
      <Copyright />
    </div>
  )
}

export default Prescription
