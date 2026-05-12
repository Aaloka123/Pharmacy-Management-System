package com.mednexus.mednexus.user.dto;

public record ChangePasswordRequest(
		String currentPassword,
		String newPassword) {
}
