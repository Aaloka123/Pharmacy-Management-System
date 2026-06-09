package com.mednexus.mednexus.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record VerifyOtpRequest(
		@NotBlank String otpToken,
		@NotBlank @Pattern(regexp = "\\d{6}") String code) {
}
