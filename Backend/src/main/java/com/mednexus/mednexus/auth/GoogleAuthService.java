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
import com.mednexus.mednexus.vendor.Vendor;
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

		// User and vendor are separate accounts (different tables). Same email is allowed on both.
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
		String fullName = google.fullName();
		String phoneNumber = GOOGLE_PHONE_PLACEHOLDER;
		String profileImage = google.profileImageUrl();

		var vendorOpt = vendorRepository.findByEmailIgnoreCase(google.email());
		if (vendorOpt.isPresent()) {
			Vendor vendor = vendorOpt.get();
			if (vendor.getName() != null && !vendor.getName().isBlank()) {
				fullName = vendor.getName();
			}
			if (vendor.getPhoneNumber() != null && !vendor.getPhoneNumber().isBlank()) {
				phoneNumber = vendor.getPhoneNumber();
			}
			if ((profileImage == null || profileImage.isBlank())
					&& vendor.getProfileImage() != null
					&& !vendor.getProfileImage().isBlank()) {
				profileImage = vendor.getProfileImage();
			}
		}

		User user = new User(
				fullName,
				google.email(),
				phoneNumber,
				passwordEncoder.encode("google-oauth:" + UUID.randomUUID()));
		user.setGoogleId(google.googleId());
		user.setProfileImage(profileImage);
		user.setRole(Role.USER);
		return userRepository.save(user);
	}
}
