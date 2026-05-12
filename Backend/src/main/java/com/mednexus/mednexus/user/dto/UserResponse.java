package com.mednexus.mednexus.user.dto;

import com.mednexus.mednexus.user.Role;

public record UserResponse(
		Long id,
		String fullName,
		String email,
		String phoneNumber,
		String location,
		String profileImage,
		Role role) {
}
