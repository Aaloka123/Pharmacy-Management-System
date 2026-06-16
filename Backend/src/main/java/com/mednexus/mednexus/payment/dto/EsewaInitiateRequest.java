package com.mednexus.mednexus.payment.dto;

import java.util.List;

import jakarta.validation.constraints.NotEmpty;

public record EsewaInitiateRequest(
		@NotEmpty List<Long> cartItemIds) {
}
