package com.mednexus.mednexus.user;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mednexus.mednexus.user.dto.SignupRequest;
import com.mednexus.mednexus.user.dto.UserResponse;

@Service
public class UserService {

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;

	public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
	}

	@Transactional
	public UserResponse register(SignupRequest request) {
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
		return new UserResponse(saved.getId(), saved.getFullName(), saved.getEmail(), saved.getPhoneNumber());
	}
}
