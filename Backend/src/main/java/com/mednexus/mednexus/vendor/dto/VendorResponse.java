package com.mednexus.mednexus.vendor.dto;

import java.time.Instant;

import com.mednexus.mednexus.vendor.VendorStatus;
import com.mednexus.mednexus.vendor.StoreStatus;

public record VendorResponse(
		Long id,
		String name,
		String email,
		String phoneNumber,
		String location,
		String businessPanVatId,
		String businessName,
		String businessLocation,
		String pharmacyLicense,
		String pharmacyManagementCertificate,
		String panVatCertificate,
		String profileImage,
		VendorStatus status,
		StoreStatus storeStatus,
		boolean storeLockedByAdmin,
		Instant createdAt,
		Instant decidedAt) {
}
