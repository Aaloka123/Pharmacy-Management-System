package com.mednexus.mednexus.contact.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ContactMessageRequest(
		@NotBlank @Size(max = 120) String fullName,
		@NotBlank @Email @Size(max = 255) String email,
		@NotBlank @Pattern(regexp = "^\\d{10}$", message = "Phone number must be exactly 10 digits") String phone,
		@NotBlank @Size(max = 2000) String message) {
}
