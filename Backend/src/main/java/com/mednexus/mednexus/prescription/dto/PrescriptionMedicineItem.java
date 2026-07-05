package com.mednexus.mednexus.prescription.dto;

import java.util.List;

public record PrescriptionMedicineItem(
		String name,
		String dosage,
		String frequency,
		String duration) {
}
