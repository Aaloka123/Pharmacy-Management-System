
import { api, resolveBackendUrl, resolveMediaUrl } from './api'
import { getAccessToken } from './auth'

export type PrescriptionMedicineItem = {
  name: string
  dosage: string
  frequency: string
  duration: string
}

export type PrescriptionRecord = {
  id: number
  imageUrl: string
  fullText: string
  medicines: PrescriptionMedicineItem[]
  doctorNotes: string
  createdAt: string
}

export type PrescriptionSummary = {
  id: number
  imageUrl: string
  previewText: string
  medicineCount: number
  createdAt: string
}

/** @deprecated Use PrescriptionRecord */
export type PrescriptionOcrResult = Pick<
  PrescriptionRecord,
  'fullText' | 'medicines' | 'doctorNotes'
>

const MAX_DIMENSION = 1280
const SCAN_TIMEOUT_MS = 7 * 60 * 1000

function normalizeRecord(data: PrescriptionRecord): PrescriptionRecord {
  return {
    id: data.id,
    imageUrl: resolveMediaUrl(data.imageUrl) ?? data.imageUrl,
    fullText: data.fullText ?? '',
    medicines: data.medicines ?? [],
    doctorNotes: data.doctorNotes ?? '',
    createdAt: data.createdAt,
  }
}

function normalizeSummary(data: PrescriptionSummary): PrescriptionSummary {
  return {
    id: data.id,
    imageUrl: resolveMediaUrl(data.imageUrl) ?? data.imageUrl,
    previewText: data.previewText ?? '',
    medicineCount: data.medicineCount ?? 0,
    createdAt: data.createdAt,
  }
}

async function compressPrescriptionImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) {
    return file
  }

  const bitmap = await createImageBitmap(file)
  const largestSide = Math.max(bitmap.width, bitmap.height)
  const scale = largestSide > MAX_DIMENSION ? MAX_DIMENSION / largestSide : 1
  const width = Math.max(1, Math.round(bitmap.width * scale))
  const height = Math.max(1, Math.round(bitmap.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) {
    bitmap.close()
    return file
  }

  context.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', 0.85)
  })
  if (!blob) {
    return file
  }

  const baseName = file.name.replace(/\.[^.]+$/, '') || 'prescription'
  return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' })
}

export async function fetchMyPrescriptions(): Promise<PrescriptionSummary[]> {
  const { data } = await api.get<PrescriptionSummary[]>('/api/prescription')
  return (data ?? []).map(normalizeSummary)
}

export async function fetchPrescription(id: number): Promise<PrescriptionRecord> {
  const { data } = await api.get<PrescriptionRecord>(`/api/prescription/${id}`)
  return normalizeRecord(data)
}

export async function deletePrescription(id: number): Promise<void> {
  await api.delete(`/api/prescription/${id}`)
}

export async function scanPrescriptionImage(file: File): Promise<PrescriptionRecord> {
  const prepared = await compressPrescriptionImage(file)
  const form = new FormData()
  form.append('file', prepared)

  const controller = new AbortController()
  const timeoutId = window.setTimeout(() => controller.abort(), SCAN_TIMEOUT_MS)

  try {
    const token = getAccessToken()
    const response = await fetch(resolveBackendUrl('/api/prescription/ocr'), {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
      signal: controller.signal,
    })

    if (!response.ok) {
      let message = `Request failed with status ${response.status}`
      try {
        const body = (await response.json()) as { message?: string; error?: string }
        message = body.message?.trim() || body.error?.trim() || message
      } catch {
        // ignore
      }
      throw new Error(message)
    }

    const data = (await response.json()) as PrescriptionRecord
    return normalizeRecord(data)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error(
        'Scan timed out after 7 minutes. Keep Ollama running, use a smaller/clearer photo, then try again.',
      )
    }
    throw error
  } finally {
    window.clearTimeout(timeoutId)
  }
}
