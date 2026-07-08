package com.mednexus.mednexus.cart.dto;

import java.math.BigDecimal;

public record CartItemResponse(
		Long id,
		Long productId,
		String productName,
		String category,
		String form,
		String strength,
		String pack,
		BigDecimal unitPrice,
		String image,
		int qty,
		int stock,
		String vendorName,
		boolean vendorStoreOpen,
		boolean productActive) {
}
