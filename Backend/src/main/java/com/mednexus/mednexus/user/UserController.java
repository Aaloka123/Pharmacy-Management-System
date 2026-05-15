package com.mednexus.mednexus.user;

import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
import com.mednexus.mednexus.user.dto.UpdateProfileRequest;
import com.mednexus.mednexus.user.dto.UserResponse;

@RestController
@RequestMapping("/api/users")
public class UserController {

	private final UserService userService;

	public UserController(UserService userService) {
		this.userService = userService;
	}

	@GetMapping("/{id}")
	@PreAuthorize("hasRole('ADMIN') or (!principal.vendorAccount and #id == principal.subjectId)")
	public ResponseEntity<UserResponse> getById(@PathVariable Long id) {
		return ResponseEntity.ok(userService.getProfileById(id));
	}

	@PutMapping("/{id}")
	@PreAuthorize("hasRole('ADMIN') or (!principal.vendorAccount and #id == principal.subjectId)")
	public ResponseEntity<UserResponse> updateProfile(@PathVariable Long id, @RequestBody UpdateProfileRequest request) {
		return ResponseEntity.ok(userService.updateProfile(id, request));
	}

	@PutMapping("/{id}/password")
	@PreAuthorize("hasRole('ADMIN') or (!principal.vendorAccount and #id == principal.subjectId)")
	public ResponseEntity<Void> changePassword(@PathVariable Long id, @RequestBody ChangePasswordRequest request) {
		userService.changePassword(id, request);
		return ResponseEntity.noContent().build();
	}

	@PostMapping(value = "/{id}/profile-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@PreAuthorize("hasRole('ADMIN') or (!principal.vendorAccount and #id == principal.subjectId)")
	public ResponseEntity<UserResponse> uploadProfileImage(
			@PathVariable Long id,
			@RequestParam("image") MultipartFile image) {
		return ResponseEntity.ok(userService.updateProfileImage(id, image));
	}

	@GetMapping
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<List<UserResponse>> list(@RequestParam(name = "role", required = false) Role role) {
		Role target = role != null ? role : Role.USER;
		return ResponseEntity.ok(userService.listByRole(target));
	}
}
