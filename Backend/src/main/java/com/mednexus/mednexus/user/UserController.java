package com.mednexus.mednexus.user;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.mednexus.mednexus.user.dto.ChangePasswordRequest;
import com.mednexus.mednexus.user.dto.LoginRequest;
import com.mednexus.mednexus.user.dto.SignupRequest;
import com.mednexus.mednexus.user.dto.UpdateProfileRequest;
import com.mednexus.mednexus.user.dto.UserResponse;

@RestController
@RequestMapping("/api/users")
public class UserController {

	private final UserService userService;

	public UserController(UserService userService) {
		this.userService = userService;
	}

	@PostMapping("/signup")
	public ResponseEntity<UserResponse> signup(@RequestBody SignupRequest request) {
		UserResponse body = userService.register(request);
		return ResponseEntity.status(HttpStatus.CREATED).body(body);
	}

	@PostMapping("/login")
	public ResponseEntity<UserResponse> login(@RequestBody LoginRequest request) {
		return ResponseEntity.ok(userService.login(request));
	}

	@PutMapping("/{id}")
	public ResponseEntity<UserResponse> updateProfile(@PathVariable Long id, @RequestBody UpdateProfileRequest request) {
		return ResponseEntity.ok(userService.updateProfile(id, request));
	}

	@PutMapping("/{id}/password")
	public ResponseEntity<Void> changePassword(@PathVariable Long id, @RequestBody ChangePasswordRequest request) {
		userService.changePassword(id, request);
		return ResponseEntity.noContent().build();
	}

	@PostMapping(value = "/{id}/profile-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<UserResponse> uploadProfileImage(
			@PathVariable Long id,
			@RequestParam("image") MultipartFile image) {
		return ResponseEntity.ok(userService.updateProfileImage(id, image));
	}

	@GetMapping
	public ResponseEntity<List<UserResponse>> list(@RequestParam(name = "role", required = false) Role role) {
		Role target = role != null ? role : Role.USER;
		return ResponseEntity.ok(userService.listByRole(target));
	}
}
