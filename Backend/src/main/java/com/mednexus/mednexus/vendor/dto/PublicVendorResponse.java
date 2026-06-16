package com.mednexus.mednexus.vendor.dto;

import java.time.Instant;

import com.mednexus.mednexus.vendor.StoreStatus;

public record PublicVendorResponse(
		Long id,
		String name,
		String businessName,
		String businessLocation,
		String location,
		String phoneNumber,
		String email,
		String pharmacyLicense,
		String profileImage,
		StoreStatus storeStatus,
		Instant createdAt) {
}
