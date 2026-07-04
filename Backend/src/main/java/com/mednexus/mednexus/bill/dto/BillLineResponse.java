package com.mednexus.mednexus.bill.dto;

import java.math.BigDecimal;

public record BillLineResponse(
		Long id,
		String productName,
		String description,
		int quantity,
		BigDecimal unitPrice,
		BigDecimal lineAmount,
		int sortOrder) {
}
