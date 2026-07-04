package com.mednexus.mednexus.bill.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import com.mednexus.mednexus.bill.BillStatus;
import com.mednexus.mednexus.order.PaymentMethod;

public record BillResponse(
		Long id,
		String invoiceNumber,
		LocalDate invoiceDate,
		LocalDate dueDate,
		String paymentTerms,
		PaymentMethod paymentMethod,
		BillStatus status,
		String billToName,
		String billToEmail,
		String billToPhone,
		String billToAddress,
		String vendorBusinessName,
		String vendorPanVatId,
		String vendorBusinessLocation,
		String vendorPhone,
		String vendorEmail,
		BigDecimal subtotal,
		BigDecimal taxPercent,
		BigDecimal taxAmount,
		BigDecimal discountPercent,
		BigDecimal discountAmount,
		BigDecimal totalAmount,
		Instant createdAt,
		List<BillLineResponse> lines) {
}
