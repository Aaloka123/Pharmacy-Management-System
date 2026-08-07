package com.mednexus.mednexus.bill.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import com.mednexus.mednexus.bill.BillStatus;
import com.mednexus.mednexus.order.dto.PaymentMethodDto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateBillRequest(
		@NotBlank @Size(max = 40) String invoiceNumber,
		@NotNull LocalDate invoiceDate,
		LocalDate dueDate,
		@NotBlank @Size(max = 80) String paymentTerms,
		@NotNull PaymentMethodDto paymentMethod,
		@NotNull BillStatus status,
		@NotBlank @Size(max = 120) String billToName,
		@NotBlank @Email @Size(max = 120) String billToEmail,
		@NotBlank @Pattern(regexp = "\\d{10}", message = "Phone number must be exactly 10 digits") String billToPhone,
		@NotBlank @Size(max = 500) String billToAddress,
		/** Optional — use 0 when no discount. */
		@DecimalMin("0.00") @DecimalMax("100.00") BigDecimal discountPercent,
		@NotEmpty @Valid List<BillLineRequest> lines) {
}
