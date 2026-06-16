package com.mednexus.mednexus.order.dto;

import java.math.BigDecimal;
import java.time.Instant;

import com.mednexus.mednexus.order.OrderStatus;
import com.mednexus.mednexus.order.PaymentMethod;

public record VendorOrderResponse(
		Long id,
		Long productId,
		String clientName,
		String email,
		String phone,
		String location,
		String vendorName,
		String productName,
		String productSku,
		String productImage,
		BigDecimal unitPrice,
		int quantity,
		PaymentMethod paymentMethod,
		Instant orderDate,
		OrderStatus status) {
}
