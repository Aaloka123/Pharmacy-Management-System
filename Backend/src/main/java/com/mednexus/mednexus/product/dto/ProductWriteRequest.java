package com.mednexus.mednexus.product.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import com.mednexus.mednexus.product.ProductStatus;
 //Frontendend to backend data transfer object
public record ProductWriteRequest(
		String productName,
		String sku,
		String category,
		String strength,
		String form,
		String quantity,
		String storageRequirements,
		LocalDate expiryDate,
		String productDescription,
		List<String> dosageInstructions,
		List<String> sideEffects,
		BigDecimal price,
		Integer stock,
		ProductStatus status,
		Boolean prescriptionRequired,
		List<String> existingImages) {
}
