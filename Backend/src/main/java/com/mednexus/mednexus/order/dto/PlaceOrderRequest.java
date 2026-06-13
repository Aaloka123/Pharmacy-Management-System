package com.mednexus.mednexus.order.dto;

import java.util.List;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

public record PlaceOrderRequest(
		@NotNull PaymentMethodDto paymentMethod,
		@NotEmpty List<Long> cartItemIds) {
}
