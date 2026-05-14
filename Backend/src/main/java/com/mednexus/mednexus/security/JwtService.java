package com.mednexus.mednexus.security;

import java.nio.charset.StandardCharsets;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.stereotype.Service;

import com.mednexus.mednexus.user.User;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

	private final JwtProperties jwtProperties;

	public JwtService(JwtProperties jwtProperties) {
		this.jwtProperties = jwtProperties;
	}

	public String generateForPlatformUser(User user) {
		byte[] keyBytes = jwtProperties.getSecret().getBytes(StandardCharsets.UTF_8);
		SecretKey key = Keys.hmacShaKeyFor(keyBytes);
		long expMs = jwtProperties.getExpirationMs();
		long now = System.currentTimeMillis();
		return Jwts.builder()
				.subject(user.getEmail())
				.claim("role", user.getRole().name())
				.issuedAt(new Date(now))
				.expiration(new Date(now + expMs))
				.signWith(key)
				.compact();
	}
}
