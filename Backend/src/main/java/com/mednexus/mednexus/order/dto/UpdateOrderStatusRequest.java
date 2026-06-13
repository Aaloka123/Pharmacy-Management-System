package com.mednexus.mednexus.order.dto;

import com.mednexus.mednexus.order.OrderStatus;

import jakarta.validation.constraints.NotNull;

public record UpdateOrderStatusRequest(
		@NotNull OrderStatus status) {
}
