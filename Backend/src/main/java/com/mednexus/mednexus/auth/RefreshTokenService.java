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

import com.mednexus.mednexus.user.User;
import com.mednexus.mednexus.vendor.Vendor;

@Service
public class RefreshTokenService {

	private static final SecureRandom RANDOM = new SecureRandom();

	private final RefreshTokenRepository refreshTokenRepository;
	private final com.mednexus.mednexus.security.JwtProperties jwtProperties;

	@Autowired
	public RefreshTokenService(RefreshTokenRepository refreshTokenRepository,
			com.mednexus.mednexus.security.JwtProperties jwtProperties) {
		this.refreshTokenRepository = refreshTokenRepository;
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

	@Transactional
	public String issueForUser(User user) {
		String raw = newRawToken();
		RefreshToken entity = new RefreshToken();
		entity.setTokenHash(hashToken(raw));
		entity.setUser(user);
		entity.setVendor(null);
		entity.setExpiresAt(Instant.now().plusMillis(jwtProperties.getRefreshExpirationMs()));
		entity.setRevoked(false);
		refreshTokenRepository.save(entity);
		return raw;
	}

	@Transactional
	public String issueForVendor(Vendor vendor) {
		String raw = newRawToken();
		RefreshToken entity = new RefreshToken();
		entity.setTokenHash(hashToken(raw));
		entity.setUser(null);
		entity.setVendor(vendor);
		entity.setExpiresAt(Instant.now().plusMillis(jwtProperties.getRefreshExpirationMs()));
		entity.setRevoked(false);
		refreshTokenRepository.save(entity);
		return raw;
	}

	public record RotationResult(String newRefreshTokenRaw, User platformUser, Vendor vendor) {
	}

	/**
	 * Validates refresh token, revokes the row, and issues a new refresh token (rotation).
	 */
	@Transactional
	public Optional<RotationResult> rotate(String rawRefresh) {
		if (rawRefresh == null || rawRefresh.isBlank()) {
			return Optional.empty();
		}
		String hash = hashToken(rawRefresh.trim());
		Optional<RefreshToken> opt = refreshTokenRepository.findByTokenHashAndRevokedFalse(hash);
		if (opt.isEmpty()) {
			return Optional.empty();
		}
		RefreshToken row = opt.get();
		if (row.getExpiresAt().isBefore(Instant.now())) {
			row.setRevoked(true);
			refreshTokenRepository.save(row);
			return Optional.empty();
		}
		row.setRevoked(true);
		refreshTokenRepository.save(row);
		if (row.getUser() != null) {
			User u = row.getUser();
			return Optional.of(new RotationResult(issueForUser(u), u, null));
		}
		if (row.getVendor() != null) {
			Vendor v = row.getVendor();
			return Optional.of(new RotationResult(issueForVendor(v), null, v));
		}
		return Optional.empty();
	}

	@Transactional
	public void revokeIfPresent(String rawRefresh) {
		if (rawRefresh == null || rawRefresh.isBlank()) {
			return;
		}
		String hash = hashToken(rawRefresh.trim());
		refreshTokenRepository.findByTokenHashAndRevokedFalse(hash).ifPresent(row -> {
			row.setRevoked(true);
			refreshTokenRepository.save(row);
		});
	}

	@Transactional
	public void revokeAllForUser(Long userId) {
		refreshTokenRepository.revokeAllActiveForUser(userId);
	}

	@Transactional
	public void revokeAllForVendor(Long vendorId) {
		refreshTokenRepository.revokeAllActiveForVendor(vendorId);
	}
}
