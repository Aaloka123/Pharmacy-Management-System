
import { resolveBackendUrl } from './api'
import { getAccessToken } from './auth'

export type PrescriptionMedicineItem = {
  name: string
  dosage: string
  frequency: string
  duration: string
}

export type PrescriptionOcrResult = {
  fullText: string
  medicines: PrescriptionMedicineItem[]
  doctorNotes: string
}

const MAX_DIMENSION = 1280
const SCAN_TIMEOUT_MS = 7 * 60 * 1000

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

export async function scanPrescriptionImage(file: File): Promise<PrescriptionOcrResult> {
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

    const data = (await response.json()) as PrescriptionOcrResult
    return {
      fullText: data.fullText ?? '',
      medicines: data.medicines ?? [],
      doctorNotes: data.doctorNotes ?? '',
    }
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
