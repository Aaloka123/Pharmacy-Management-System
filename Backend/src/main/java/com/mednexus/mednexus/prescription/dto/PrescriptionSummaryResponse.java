package com.mednexus.mednexus.prescription.dto;

import java.time.Instant;

public record PrescriptionSummaryResponse(
		Long id,
		String imageUrl,
		String previewText,
		int medicineCount,
		Instant createdAt) {
}
