package com.mednexus.mednexus.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
		@NotBlank String otpToken,
		@NotBlank @Pattern(regexp = "\\d{6}") String code,
		@NotBlank @Size(min = 6) String newPassword) {
}
