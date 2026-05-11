package com.mednexus.mednexus.user.dto;

public record UpdateProfileRequest(
		String fullName,
		String phoneNumber,
		String location) {
}
