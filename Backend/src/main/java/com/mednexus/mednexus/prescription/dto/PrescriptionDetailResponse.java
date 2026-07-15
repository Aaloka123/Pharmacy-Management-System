package com.mednexus.mednexus.prescription.dto;

import java.time.Instant;
import java.util.List;

public record PrescriptionDetailResponse(
		Long id,
		String imageUrl,
		String fullText,
		List<PrescriptionMedicineItem> medicines,
		String doctorNotes,
		Instant createdAt) {
}
