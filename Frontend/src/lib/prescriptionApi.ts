import { api } from './api'

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

export async function scanPrescriptionImage(file: File): Promise<PrescriptionOcrResult> {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post<PrescriptionOcrResult>('/api/prescription/ocr', form)
  return {
    fullText: data.fullText ?? '',
    medicines: data.medicines ?? [],
    doctorNotes: data.doctorNotes ?? '',
  }
}
