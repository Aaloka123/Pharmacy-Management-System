package com.mednexus.mednexus.vendor.dto;

public record VendorChangePasswordRequest(
		String currentPassword,
		String newPassword) {
}
