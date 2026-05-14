package com.mednexus.mednexus.user;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.mednexus.mednexus.user.dto.ChangePasswordRequest;
import com.mednexus.mednexus.user.dto.LoginRequest;
import com.mednexus.mednexus.user.dto.SignupRequest;
import com.mednexus.mednexus.user.dto.UpdateProfileRequest;
import com.mednexus.mednexus.user.dto.UserResponse;

@Service
public class UserService {

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final UserFileStorage fileStorage;

	public UserService(UserRepository userRepository,
			PasswordEncoder passwordEncoder,
			UserFileStorage fileStorage) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.fileStorage = fileStorage;
	}

	@Transactional
	public UserResponse register(SignupRequest request) {
		if (request == null) {
			throw new IllegalArgumentException("Request body is required");
		}
		if (request.fullName() == null || request.fullName().isBlank()) {
			throw new IllegalArgumentException("Full name is required");
		}
		if (request.email() == null || request.email().isBlank()) {
			throw new IllegalArgumentException("Email is required");
		}
		if (request.phoneNumber() == null || request.phoneNumber().isBlank()) {
			throw new IllegalArgumentException("Phone number is required");
		}
		if (request.password() == null || request.password().length() < 6) {
			throw new IllegalArgumentException("Password must be at least 6 characters");
		}
		String email = request.email().trim();
		if (userRepository.existsByEmailIgnoreCase(email)) {
			throw new DuplicateEmailException();
		}
		User user = new User(
				request.fullName().trim(),
				email,
				request.phoneNumber().trim(),
				passwordEncoder.encode(request.password()));
		User saved = userRepository.save(user);
		return toResponse(saved);
	}

	@Transactional(readOnly = true)
	public UserResponse getProfileById(Long id) {
		User user = userRepository.findById(id).orElseThrow(UserNotFoundException::new);
		return toResponse(user);
	}

	@Transactional
	public UserResponse login(LoginRequest request) {
		if (request == null || request.email() == null || request.password() == null) {
			throw new InvalidCredentialsException();
		}
		User user = userRepository.findByEmailIgnoreCase(request.email().trim())
				.orElseThrow(InvalidCredentialsException::new);
		if (!passwordEncoder.matches(request.password(), user.getPassword())) {
			throw new InvalidCredentialsException();
		}
		// Transparently upgrade old (slow) hashes to the current strength so
		// subsequent logins for this user are fast.
		if (passwordEncoder.upgradeEncoding(user.getPassword())) {
			user.setPassword(passwordEncoder.encode(request.password()));
		}
		return toResponse(user);
	}

	@Transactional(readOnly = true)
	public java.util.List<UserResponse> listByRole(Role role) {
		return userRepository.findAllByRoleOrderByIdAsc(role)
				.stream()
				.map(this::toResponse)
				.toList();
	}

	@Transactional
	public void changePassword(Long id, ChangePasswordRequest request) {
		if (request == null || request.currentPassword() == null || request.newPassword() == null) {
			throw new InvalidCredentialsException();
		}
		if (request.newPassword().length() < 6) {
			throw new IllegalArgumentException("New password must be at least 6 characters");
		}
		User user = userRepository.findById(id).orElseThrow(UserNotFoundException::new);
		if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
			throw new InvalidCredentialsException();
		}
		user.setPassword(passwordEncoder.encode(request.newPassword()));
	}

	@Transactional
	public UserResponse updateProfileImage(Long id, MultipartFile image) {
		User user = userRepository.findById(id).orElseThrow(UserNotFoundException::new);
		String url = fileStorage.storeProfileImage(image, id);
		user.setProfileImage(url);
		return toResponse(user);
	}

	@Transactional
	public UserResponse updateProfile(Long id, UpdateProfileRequest request) {
		User user = userRepository.findById(id).orElseThrow(UserNotFoundException::new);
		if (request.fullName() != null && !request.fullName().isBlank()) {
			user.setFullName(request.fullName().trim());
		}
		if (request.phoneNumber() != null && !request.phoneNumber().isBlank()) {
			user.setPhoneNumber(request.phoneNumber().trim());
		}
		if (request.location() != null) {
			String loc = request.location().trim();
			user.setLocation(loc.isEmpty() ? null : loc);
		}
		return toResponse(user);
	}

	private UserResponse toResponse(User user) {
		return new UserResponse(
				user.getId(),
				user.getFullName(),
				user.getEmail(),
				user.getPhoneNumber(),
				user.getLocation(),
				user.getProfileImage(),
				user.getRole());
	}
}
