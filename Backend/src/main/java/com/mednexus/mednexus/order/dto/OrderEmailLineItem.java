package com.mednexus.mednexus.order.dto;

import java.math.BigDecimal;

public record OrderEmailLineItem(
		String productName,
		String sku,
		String imageUrl,
		int quantity,
		BigDecimal unitPrice,
		BigDecimal lineTotal) {
}
