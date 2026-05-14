package com.mednexus.mednexus.auth;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mednexus.mednexus.auth.dto.AuthRequest;
import com.mednexus.mednexus.auth.dto.AuthResponse;
import com.mednexus.mednexus.security.JwtService;
import com.mednexus.mednexus.user.User;
import com.mednexus.mednexus.user.UserRepository;
import com.mednexus.mednexus.user.UserService;
import com.mednexus.mednexus.user.dto.SignupRequest;
import com.mednexus.mednexus.user.dto.UserResponse;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

	private final AuthenticationManager authenticationManager;
	private final UserRepository userRepository;
	private final UserService userService;
	private final JwtService jwtService;

	public AuthController(
			AuthenticationManager authenticationManager,
			UserRepository userRepository,
			UserService userService,
			JwtService jwtService) {
		this.authenticationManager = authenticationManager;
		this.userRepository = userRepository;
		this.userService = userService;
		this.jwtService = jwtService;
	}

	@GetMapping("/login")
	public ResponseEntity<Map<String, String>> loginRequiresPost() {
		return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
				.body(Map.of(
						"message", "Use HTTP POST with Content-Type: application/json",
						"body", "{\"email\":\"...\",\"password\":\"...\"}"));
	}

	@PostMapping("/login")
	public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
		authenticationManager.authenticate(
				new UsernamePasswordAuthenticationToken(request.email().trim(), request.password()));
		User user = userRepository.findByEmailIgnoreCase(request.email().trim())
				.orElseThrow();
		String token = jwtService.generateForPlatformUser(user);
		UserResponse body = userService.getProfileById(user.getId());
		return ResponseEntity.ok(new AuthResponse(token, body));
	}

	@PostMapping("/register")
	public ResponseEntity<AuthResponse> register(@RequestBody SignupRequest request) {
		UserResponse created = userService.register(request);
		User user = userRepository.findById(created.id())
				.orElseThrow();
		String token = jwtService.generateForPlatformUser(user);
		return ResponseEntity.status(HttpStatus.CREATED).body(new AuthResponse(token, created));
	}
}
