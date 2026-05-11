package com.mednexus.mednexus.user.dto;

public record SignupRequest(
		String fullName,
		String email,
		String phoneNumber,
		String password) {
}
