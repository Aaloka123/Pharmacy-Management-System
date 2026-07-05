import { useRef, useState, type ChangeEvent } from 'react'
import { FiImage, FiUploadCloud } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import Copyright from '../UserComponents/Copyright'
import Footer from '../UserComponents/Footer'
import Header from '../UserComponents/Header'
import FadeInOnScroll from '../components/FadeInOnScroll'
import { scanPrescriptionImage, type PrescriptionOcrResult } from '../lib/prescriptionApi'

const ACCEPTED_IMAGES = 'image/jpeg,image/png,image/webp,image/gif'

const Prescription = () => {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [scanning, setScanning] = useState(false)
  const [result, setResult] = useState<PrescriptionOcrResult | null>(null)

  const resetPreview = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(null)
    setSelectedFile(null)
    setResult(null)
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

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setResult(null)
  }

  const handleScan = async () => {
    if (!selectedFile || scanning) return

    setScanning(true)
    try {
      const scanned = await scanPrescriptionImage(selectedFile)
      setResult(scanned)
      if (!scanned.fullText.trim() && scanned.medicines.length === 0) {
        toast.info('No readable text was found. Try a clearer photo with good lighting.')
      } else {
        toast.success('Prescription scanned successfully.')
      }
    } catch (error) {
      const message =
        error instanceof Error && error.message
          ? error.message
          : 'Could not read the prescription. Make sure Ollama is running with moondream:latest.'
      toast.error(message)
    } finally {
      setScanning(false)
    }
  }

  return (
    <div className="bg-white">
      <Header />
      <main className="bg-white px-4 pb-10 pt-4 md:px-8 lg:px-[80px]">
        <section className="mx-auto w-full max-w-6xl">
          <FadeInOnScroll>
            <div>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-[30px]">
                New Prescription
              </h1>
              <p className="mt-3 text-sm text-slate-600 md:text-base">
                Upload a photo of your handwritten prescription. AI will read it and extract the medicines for you.
              </p>
            </div>

            <div className={`mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-5 md:p-8 ${result ? 'hidden' : ''}`}>
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

                  <div className="flex flex-wrap gap-3">
                    <button
                      className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={scanning}
                      onClick={() => void handleScan()}
                      type="button"
                    >
                      {scanning ? 'Reading prescription…' : 'Scan with AI'}
                    </button>
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

            {result && previewUrl ? (
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

                <div className="flex flex-wrap gap-3">
                  <button
                    className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={scanning}
                    onClick={() => void handleScan()}
                    type="button"
                  >
                    {scanning ? 'Reading prescription…' : 'Scan again'}
                  </button>
                  <button
                    className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    onClick={() => fileInputRef.current?.click()}
                    type="button"
                  >
                    <FiImage className="h-4 w-4" />
                    Change photo
                  </button>
                </div>

                {result.doctorNotes ? (
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
                    <h2 className="text-lg font-semibold text-slate-900">Notes</h2>
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{result.doctorNotes}</p>
                  </div>
                ) : null}

                {result.medicines.length > 0 ? (
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
                          </tr>
                        </thead>
                        <tbody>
                          {result.medicines.map((medicine, index) => (
                            <tr className="border-b border-slate-100" key={`${medicine.name}-${index}`}>
                              <td className="px-3 py-3 font-medium text-slate-900">{medicine.name}</td>
                              <td className="px-3 py-3 text-slate-700">{medicine.dosage || '—'}</td>
                              <td className="px-3 py-3 text-slate-700">{medicine.frequency || '—'}</td>
                              <td className="px-3 py-3 text-slate-700">{medicine.duration || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : null}

                <div className="rounded-2xl border border-slate-200 bg-white p-5 md:p-6">
                  <h2 className="text-lg font-semibold text-slate-900">Extracted text</h2>
                  <p className="mt-3 whitespace-pre-wrap font-mono text-sm leading-6 text-slate-700">
                    {result.fullText || 'No text extracted.'}
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
          </FadeInOnScroll>
        </section>
      </main>
      <Footer />
      <Copyright />
    </div>
  )
}

export default Prescription
