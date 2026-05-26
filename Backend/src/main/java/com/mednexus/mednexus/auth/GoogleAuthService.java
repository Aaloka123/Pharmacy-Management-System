package com.mednexus.mednexus.auth;

import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.mednexus.mednexus.auth.GoogleTokenVerifierService.VerifiedGoogleIdentity;
import com.mednexus.mednexus.user.Role;
import com.mednexus.mednexus.user.User;
import com.mednexus.mednexus.user.UserRepository;
import com.mednexus.mednexus.vendor.VendorRepository;

@Service
public class GoogleAuthService {

	private static final String GOOGLE_PHONE_PLACEHOLDER = "N/A";

	private final GoogleTokenVerifierService googleTokenVerifier;
	private final UserRepository userRepository;
	private final VendorRepository vendorRepository;
	private final PasswordEncoder passwordEncoder;

	@Autowired
	public GoogleAuthService(
			GoogleTokenVerifierService googleTokenVerifier,
			UserRepository userRepository,
			VendorRepository vendorRepository,
			PasswordEncoder passwordEncoder) {
		this.googleTokenVerifier = googleTokenVerifier;
		this.userRepository = userRepository;
		this.vendorRepository = vendorRepository;
		this.passwordEncoder = passwordEncoder;
	}

	@Transactional
	public User authenticate(String rawIdToken) {
		VerifiedGoogleIdentity google = googleTokenVerifier.verify(rawIdToken);

		if (vendorRepository.existsByEmailIgnoreCase(google.email())) {
			throw new ResponseStatusException(
					HttpStatus.FORBIDDEN,
					"This email is registered as a vendor. Use vendor login instead.");
		}

		return userRepository.findByGoogleId(google.googleId())
				.or(() -> userRepository.findByEmailIgnoreCase(google.email()))
				.map(user -> linkGoogleAccount(user, google))
				.orElseGet(() -> createGoogleUser(google));
	}

	private User linkGoogleAccount(User user, VerifiedGoogleIdentity google) {
		if (user.getGoogleId() == null || user.getGoogleId().isBlank()) {
			user.setGoogleId(google.googleId());
		} else if (!user.getGoogleId().equals(google.googleId())) {
			throw new ResponseStatusException(
					HttpStatus.CONFLICT,
					"This email is already linked to a different Google account.");
		}
		if (google.profileImageUrl() != null && (user.getProfileImage() == null || user.getProfileImage().isBlank())) {
			user.setProfileImage(google.profileImageUrl());
		}
		return userRepository.save(user);
	}

	private User createGoogleUser(VerifiedGoogleIdentity google) {
		User user = new User(
				google.fullName(),
				google.email(),
				GOOGLE_PHONE_PLACEHOLDER,
				passwordEncoder.encode("google-oauth:" + UUID.randomUUID()));
		user.setGoogleId(google.googleId());
		user.setProfileImage(google.profileImageUrl());
		user.setRole(Role.USER);
		return userRepository.save(user);
	}
}
