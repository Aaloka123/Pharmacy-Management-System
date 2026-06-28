package com.mednexus.mednexus.order.dto;

import java.math.BigDecimal;
import java.util.List;

import com.mednexus.mednexus.order.OrderStatus;

public record OrderEmailDetails(
		String toEmail,
		String customerName,
		String customerEmail,
		String phone,
		String deliveryAddress,
		String paymentMethodLabel,
		OrderStatus status,
		List<OrderEmailLineItem> lineItems,
		BigDecimal subtotal,
		BigDecimal tax,
		BigDecimal total,
		Long primaryOrderId) {
}
