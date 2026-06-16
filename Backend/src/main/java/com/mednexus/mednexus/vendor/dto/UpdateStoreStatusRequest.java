package com.mednexus.mednexus.vendor.dto;

import com.mednexus.mednexus.vendor.StoreStatus;

import jakarta.validation.constraints.NotNull;

public record UpdateStoreStatusRequest(@NotNull StoreStatus storeStatus) {
}
