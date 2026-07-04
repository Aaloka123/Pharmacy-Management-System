package com.mednexus.mednexus.product.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import com.mednexus.mednexus.product.ProductStatus;

public record ProductResponse(
		Long id,
		Long vendorId,
		String vendorBusinessName,
		String vendorBusinessLocation,
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
		int stock,
		ProductStatus status,
		List<String> images,
		Instant createdAt,
		Instant updatedAt) {
}
