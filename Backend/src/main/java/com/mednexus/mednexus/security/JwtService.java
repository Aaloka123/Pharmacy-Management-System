package com.mednexus.mednexus.security;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Service;

import com.mednexus.mednexus.user.Role;
import com.mednexus.mednexus.user.User;
import com.mednexus.mednexus.vendor.Vendor;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.JwtParser;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

	public static final String CLAIM_TYP = "typ";
	public static final String CLAIM_SID = "sid";
	public static final String CLAIM_ROLE = "role";

	private final JwtProperties jwtProperties;

	private volatile SecretKey signingKey;
	private volatile JwtParser jwtParser;

	public JwtService(JwtProperties jwtProperties) {
		this.jwtProperties = jwtProperties;
	}

	private SecretKey signingKey() {
		SecretKey local = signingKey;
		if (local == null) {
			synchronized (this) {
				local = signingKey;
				if (local == null) {
					byte[] keyBytes = jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8);
					local = Keys.hmacShaKeyFor(keyBytes);
					signingKey = local;
				}
			}
		}
		return local;
	}

	private JwtParser jwtParser() {
		JwtParser local = jwtParser;
		if (local == null) {
			synchronized (this) {
				local = jwtParser;
				if (local == null) {
					local = Jwts.parser().verifyWith(signingKey()).build();
					jwtParser = local;
				}
			}
		}
		return local;
	}

	public String generateAccessTokenForUser(User user) {
		return buildAccess(
				user.getEmail(),
				user.getId(),
				PrincipalKind.USER,
				user.getRole());
	}

	public String generateAccessTokenForVendor(Vendor vendor) {
		return buildAccess(
				vendor.getEmail(),
				vendor.getId(),
				PrincipalKind.VENDOR,
				Role.VENDOR);
	}

	private String buildAccess(String email, long subjectId, PrincipalKind kind, Role role) {
		long now = System.currentTimeMillis();
		long expMs = jwtProperties.getAccessExpirationMs();
		return Jwts.builder()
				.subject(email)
				.claim(CLAIM_SID, subjectId)
				.claim(CLAIM_TYP, kind.name())
				.claim(CLAIM_ROLE, role.name())
				.issuedAt(new Date(now))
				.expiration(new Date(now + expMs))
				.signWith(signingKey())
				.compact();
	}

	public PlatformUser parseAccessToken(String token) throws JwtException {
		Claims claims = jwtParser().parseSignedClaims(token).getPayload();
		String email = claims.getSubject();
		Long sid = claims.get(CLAIM_SID, Long.class);
		String typ = claims.get(CLAIM_TYP, String.class);
		String roleName = claims.get(CLAIM_ROLE, String.class);
		if (email == null || sid == null || typ == null || roleName == null) {
			throw new JwtException("Missing required claims");
		}
		PrincipalKind kind = PrincipalKind.valueOf(typ);
		Role role = Role.valueOf(roleName);
		boolean vendorAccount = kind == PrincipalKind.VENDOR;
		return new PlatformUser(sid, email, role, vendorAccount);
	}
}
