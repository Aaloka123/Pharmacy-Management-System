package com.mednexus.mednexus.prescription.dto;

import java.util.List;

public record PrescriptionOcrResponse(
		String fullText,
		List<PrescriptionMedicineItem> medicines,
		String doctorNotes) {
}
