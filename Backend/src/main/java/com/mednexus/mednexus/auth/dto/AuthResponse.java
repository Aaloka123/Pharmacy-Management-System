package com.mednexus.mednexus.auth.dto;

import com.mednexus.mednexus.user.dto.UserResponse;

public record AuthResponse(String token, UserResponse user) {
}
