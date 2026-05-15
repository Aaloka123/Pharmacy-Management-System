package com.mednexus.mednexus.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "jwt")
public class JwtProperties {

	/**
	 * HS256 signing secret (use a long random value in production).
	 */
	private String secret = "";

	/**
	 * Access token TTL (short-lived for security).
	 */
	private long accessExpirationMs = 900_000L;

	/**
	 * Refresh token TTL (opaque token stored server-side).
	 */
	private long refreshExpirationMs = 604_800_000L;

	public String getSecret() {
		return secret;
	}

	public void setSecret(String secret) {
		this.secret = secret;
	}

	public long getAccessExpirationMs() {
		return accessExpirationMs;
	}

	public void setAccessExpirationMs(long accessExpirationMs) {
		this.accessExpirationMs = accessExpirationMs;
	}

	/**
	 * @deprecated use {@link #getAccessExpirationMs()}
	 */
	@Deprecated
	public long getExpirationMs() {
		return accessExpirationMs;
	}

	/**
	 * @deprecated use {@link #setAccessExpirationMs(long)}
	 */
	@Deprecated
	public void setExpirationMs(long expirationMs) {
		this.accessExpirationMs = expirationMs;
	}

	public long getRefreshExpirationMs() {
		return refreshExpirationMs;
	}

	public void setRefreshExpirationMs(long refreshExpirationMs) {
		this.refreshExpirationMs = refreshExpirationMs;
	}
}
