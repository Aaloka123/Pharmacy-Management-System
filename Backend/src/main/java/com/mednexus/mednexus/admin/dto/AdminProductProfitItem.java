package com.mednexus.mednexus.admin.dto;

import java.math.BigDecimal;
import java.time.Instant;

public record AdminProductProfitItem(
		Long productId,
		String productName,
		String productSku,
		String productImage,
		Long vendorId,
		String vendorBusinessName,
		BigDecimal unitPrice,
		long quantitySold,
		BigDecimal totalSales,
		BigDecimal adminProfit,
		Instant firstSoldAt) {
}
