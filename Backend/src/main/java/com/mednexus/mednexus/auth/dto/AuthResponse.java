package com.mednexus.mednexus.auth.dto;

import com.mednexus.mednexus.user.dto.UserResponse;

public record AuthResponse(String accessToken, String refreshToken, UserResponse user) {
}
