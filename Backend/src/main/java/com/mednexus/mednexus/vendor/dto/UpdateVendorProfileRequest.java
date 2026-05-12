package com.mednexus.mednexus.vendor.dto;

public record UpdateVendorProfileRequest(
		String name,
		String phoneNumber,
		String location,
		String businessName,
		String businessLocation,
		String pharmacyLicense) {
}
