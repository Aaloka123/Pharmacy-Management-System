package com.mednexus.mednexus.bill.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record BillLineRequest(
		@NotBlank @Size(max = 200) String productName,
		@Size(max = 500) String description,
		@NotNull @Min(1) Integer quantity,
		@NotNull @Min(0) BigDecimal unitPrice) {
}
