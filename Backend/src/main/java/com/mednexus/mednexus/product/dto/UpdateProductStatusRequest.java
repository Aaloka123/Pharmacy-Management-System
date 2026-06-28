package com.mednexus.mednexus.product.dto;

import com.mednexus.mednexus.product.ProductStatus;

import jakarta.validation.constraints.NotNull;

public record UpdateProductStatusRequest(@NotNull ProductStatus status) {
}
