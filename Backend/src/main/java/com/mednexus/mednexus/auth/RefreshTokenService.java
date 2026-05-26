package com.mednexus.mednexus.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.HexFormat;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mednexus.mednexus.security.JwtProperties;
import com.mednexus.mednexus.user.User;
import com.mednexus.mednexus.user.UserRepository;
import com.mednexus.mednexus.vendor.Vendor;
import com.mednexus.mednexus.vendor.VendorRepository;

@Service
public class RefreshTokenService {

	private static final SecureRandom RANDOM = new SecureRandom();

	private final UserRepository userRepository;
	private final VendorRepository vendorRepository;
	private final JwtProperties jwtProperties;

	@Autowired
	public RefreshTokenService(
			UserRepository userRepository,
			VendorRepository vendorRepository,
			JwtProperties jwtProperties) {
		this.userRepository = userRepository;
		this.vendorRepository = vendorRepository;
		this.jwtProperties = jwtProperties;
	}

	public static String hashToken(String rawToken) {
		try {
			byte[] digest = MessageDigest.getInstance("SHA-256")
					.digest(rawToken.getBytes(StandardCharsets.UTF_8));
			return HexFormat.of().formatHex(digest);
		}
		catch (NoSuchAlgorithmException e) {
			throw new IllegalStateException(e);
		}
	}

	private String newRawToken() {
		byte[] bytes = new byte[32];
		RANDOM.nextBytes(bytes);
		return java.util.Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
	}

	public record RotationResult(String newRefreshTokenRaw, User platformUser, Vendor vendor) {
	}

	@Transactional
	public String issueForUser(User user) {
		String raw = newRawToken();
		user.setRefreshTokenHash(hashToken(raw));
		user.setRefreshTokenExpiresAt(Instant.now().plusMillis(jwtProperties.getRefreshExpirationMs()));
		userRepository.save(user);
		return raw;
	}

	@Transactional
	public String issueForVendor(Vendor vendor) {
		String raw = newRawToken();
		vendor.setRefreshTokenHash(hashToken(raw));
		vendor.setRefreshTokenExpiresAt(Instant.now().plusMillis(jwtProperties.getRefreshExpirationMs()));
		vendorRepository.save(vendor);
		return raw;
	}

	@Transactional
	public Optional<RotationResult> rotate(String rawRefresh) {
		if (rawRefresh == null || rawRefresh.isBlank()) {
			return Optional.empty();
		}
		String hash = hashToken(rawRefresh.trim());
		Instant now = Instant.now();

		Optional<User> userOpt = userRepository.findByRefreshTokenHash(hash);
		if (userOpt.isPresent()) {
			User user = userOpt.get();
			if (!isRefreshActive(user.getRefreshTokenExpiresAt(), now)) {
				clearUserRefresh(user);
				userRepository.save(user);
				return Optional.empty();
			}
			return Optional.of(new RotationResult(issueForUser(user), user, null));
		}

		Optional<Vendor> vendorOpt = vendorRepository.findByRefreshTokenHash(hash);
		if (vendorOpt.isPresent()) {
			Vendor vendor = vendorOpt.get();
			if (!isRefreshActive(vendor.getRefreshTokenExpiresAt(), now)) {
				clearVendorRefresh(vendor);
				vendorRepository.save(vendor);
				return Optional.empty();
			}
			return Optional.of(new RotationResult(issueForVendor(vendor), null, vendor));
		}

		return Optional.empty();
	}

	@Transactional
	public void revokeIfPresent(String rawRefresh) {
		if (rawRefresh == null || rawRefresh.isBlank()) {
			return;
		}
		String hash = hashToken(rawRefresh.trim());
		userRepository.findByRefreshTokenHash(hash).ifPresent(user -> {
			clearUserRefresh(user);
			userRepository.save(user);
		});
		vendorRepository.findByRefreshTokenHash(hash).ifPresent(vendor -> {
			clearVendorRefresh(vendor);
			vendorRepository.save(vendor);
		});
	}

	@Transactional
	public void revokeAllForUser(Long userId) {
		userRepository.findById(userId).ifPresent(user -> {
			clearUserRefresh(user);
			userRepository.save(user);
		});
	}

	@Transactional
	public void revokeAllForVendor(Long vendorId) {
		vendorRepository.findById(vendorId).ifPresent(vendor -> {
			clearVendorRefresh(vendor);
			vendorRepository.save(vendor);
		});
	}

	private static boolean isRefreshActive(Instant expiresAt, Instant now) {
		return expiresAt != null && expiresAt.isAfter(now);
	}

	private static void clearUserRefresh(User user) {
		user.setRefreshTokenHash(null);
		user.setRefreshTokenExpiresAt(null);
	}

	private static void clearVendorRefresh(Vendor vendor) {
		vendor.setRefreshTokenHash(null);
		vendor.setRefreshTokenExpiresAt(null);
	}
}
