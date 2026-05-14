package com.mednexus.mednexus.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {

	/**
	 * HS256 signing secret (use a long random value in production).
	 */
	private String secret = "";

	private long expirationMs = 86400000L;

	public String getSecret() {
		return secret;
	}

	public void setSecret(String secret) {
		this.secret = secret;
	}

	public long getExpirationMs() {
		return expirationMs;
	}

	public void setExpirationMs(long expirationMs) {
		this.expirationMs = expirationMs;
	}
}
