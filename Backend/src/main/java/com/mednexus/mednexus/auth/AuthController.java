package com.mednexus.mednexus.auth;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mednexus.mednexus.auth.dto.AuthRequest;
import com.mednexus.mednexus.auth.dto.AuthResponse;
import com.mednexus.mednexus.auth.dto.LogoutRequest;
import com.mednexus.mednexus.auth.dto.RefreshTokenRequest;
import com.mednexus.mednexus.security.JwtService;
import com.mednexus.mednexus.user.Role;
import com.mednexus.mednexus.user.User;
import com.mednexus.mednexus.user.UserRepository;
import com.mednexus.mednexus.user.UserService;
import com.mednexus.mednexus.user.dto.SignupRequest;
import com.mednexus.mednexus.user.dto.UserResponse;
import com.mednexus.mednexus.vendor.Vendor;
import com.mednexus.mednexus.vendor.VendorRepository;
import com.mednexus.mednexus.vendor.VendorService;
import com.mednexus.mednexus.vendor.dto.VendorLoginRequest;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

	private final AuthenticationManager authenticationManager;
	private final UserRepository userRepository;
	private final UserService userService;
	private final JwtService jwtService;
	private final RefreshTokenService refreshTokenService;
	private final VendorService vendorService;
	private final VendorRepository vendorRepository;
	private final PasswordEncoder passwordEncoder;

	@Autowired
	public AuthController(
			AuthenticationManager authenticationManager,
			UserRepository userRepository,
			UserService userService,
			JwtService jwtService,
			RefreshTokenService refreshTokenService,
			VendorService vendorService,
			VendorRepository vendorRepository,
			PasswordEncoder passwordEncoder) {
		this.authenticationManager = authenticationManager;
		this.userRepository = userRepository;
		this.userService = userService;
		this.jwtService = jwtService;
		this.refreshTokenService = refreshTokenService;
		this.vendorService = vendorService;
		this.vendorRepository = vendorRepository;
		this.passwordEncoder = passwordEncoder;
	}

	@GetMapping("/login")
	public ResponseEntity<java.util.Map<String, String>> loginRequiresPost() {
		return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED)
				.body(java.util.Map.of(
						"message", "Use HTTP POST with Content-Type: application/json",
						"body", "{\"email\":\"...\",\"password\":\"...\"}"));
	}

	@PostMapping("/login")
	public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest request) {
		authenticationManager.authenticate(
				new UsernamePasswordAuthenticationToken(request.email().trim(), request.password()));
		User user = userRepository.findByEmailIgnoreCase(request.email().trim())
				.orElseThrow();
		if (passwordEncoder.upgradeEncoding(user.getPassword())) {
			userRepository.save(user);
		}
		String access = jwtService.generateAccessTokenForUser(user);
		String refresh = refreshTokenService.issueForUser(user);
		UserResponse body = userService.getProfileById(user.getId());
		return ResponseEntity.ok(new AuthResponse(access, refresh, body));
	}

	@PostMapping("/register")
	public ResponseEntity<UserResponse> register(@RequestBody SignupRequest request) {
		UserResponse created = userService.register(request);
		return ResponseEntity.status(HttpStatus.CREATED).body(created);
	}

	@PostMapping("/vendor/login")
	public ResponseEntity<AuthResponse> vendorLogin(@Valid @RequestBody VendorLoginRequest request) {
		var vendorResponse = vendorService.login(request);
		Vendor vendor = vendorRepository.findById(vendorResponse.id())
				.orElseThrow();
		String access = jwtService.generateAccessTokenForVendor(vendor);
		String refresh = refreshTokenService.issueForVendor(vendor);
		UserResponse body = vendorToUserResponse(vendor);
		return ResponseEntity.ok(new AuthResponse(access, refresh, body));
	}

	@PostMapping("/refresh")
	public ResponseEntity<AuthResponse> refresh(@Valid @RequestBody RefreshTokenRequest request) {
		return refreshTokenService.rotate(request.refreshToken())
				.map(result -> {
					if (result.platformUser() != null) {
						User u = result.platformUser();
						String access = jwtService.generateAccessTokenForUser(u);
						UserResponse body = userService.getProfileById(u.getId());
						return ResponseEntity.ok(new AuthResponse(access, result.newRefreshTokenRaw(), body));
					}
					Vendor v = result.vendor();
					String access = jwtService.generateAccessTokenForVendor(v);
					UserResponse body = vendorToUserResponse(v);
					return ResponseEntity.ok(new AuthResponse(access, result.newRefreshTokenRaw(), body));
				})
				.orElseGet(() -> ResponseEntity.status(HttpStatus.UNAUTHORIZED).build());
	}

	@PostMapping("/logout")
	public ResponseEntity<Void> logout(@Valid @RequestBody LogoutRequest request) {
		refreshTokenService.revokeIfPresent(request.refreshToken());
		return ResponseEntity.noContent().build();
	}

	private static UserResponse vendorToUserResponse(Vendor v) {
		return new UserResponse(
				v.getId(),
				v.getName(),
				v.getEmail(),
				v.getPhoneNumber(),
				v.getLocation(),
				v.getProfileImage(),
				Role.VENDOR);
	}
}
