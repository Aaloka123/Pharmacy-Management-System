package com.mednexus.mednexus.auth;

import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.mednexus.mednexus.auth.dto.AuthRequest;
import com.mednexus.mednexus.user.InvalidCredentialsException;

@SpringBootTest
class AuthLoginNegativeTest {

	@Autowired
	private AuthController authController;

	@Test
	void loginWithUnknownEmailThrowsInvalidCredentials() {
		AuthRequest request = new AuthRequest("unknown-user-for-test@example.com", "wrong-password");
		assertThrows(InvalidCredentialsException.class, () -> authController.login(request));
	}
}
