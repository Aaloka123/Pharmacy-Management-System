package com.mednexus.mednexus.auth.dto;

public record PendingOtpResponse(
		boolean otpRequired,
		String otpToken,
		String maskedEmail,
		String message) {
}
