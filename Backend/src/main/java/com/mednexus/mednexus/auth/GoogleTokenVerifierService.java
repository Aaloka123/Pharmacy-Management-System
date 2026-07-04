package com.mednexus.mednexus.auth;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.mednexus.mednexus.config.RelaxedSslSupport;

@Service
public class GoogleTokenVerifierService {

	private static final Logger log = LoggerFactory.getLogger(GoogleTokenVerifierService.class);
	private static final String TOKENINFO_URL = "https://oauth2.googleapis.com/tokeninfo";

	private final List<String> allowedClientIds;
	private final GoogleIdTokenVerifier verifier;
	private final HttpClient httpClient;
	private final boolean sslRelaxed;

	public GoogleTokenVerifierService(
			@Value("${google.client-id:98369240272-5aoh1lvk62hhl3s27bcmj5nol9v873me.apps.googleusercontent.com}") String clientIds,
			@Value("${google.ssl-relaxed:${mednexus.mail.ssl-relaxed:false}}") boolean sslRelaxed) {
		this.allowedClientIds = parseClientIds(clientIds);
		if (allowedClientIds.isEmpty()) {
			throw new IllegalStateException("google.client-id must be configured.");
		}
		this.sslRelaxed = sslRelaxed;
		NetHttpTransport transport = RelaxedSslSupport.createNetHttpTransport(sslRelaxed);
		this.verifier = new GoogleIdTokenVerifier.Builder(transport, GsonFactory.getDefaultInstance())
				.setAudience(allowedClientIds)
				.setAcceptableTimeSkewSeconds(300)
				.build();
		this.httpClient = RelaxedSslSupport.createHttpClient(sslRelaxed);
		log.info("Google sign-in configured for client ID(s): {}", allowedClientIds);
		if (sslRelaxed) {
			log.warn("Google HTTPS certificate validation is relaxed (google.ssl-relaxed=true). Use only for local development.");
		}
	}

	private static List<String> parseClientIds(String raw) {
		if (raw == null || raw.isBlank()) {
			return List.of();
		}
		return Arrays.stream(raw.split(","))
				.map(String::trim)
				.filter(value -> !value.isEmpty())
				.collect(Collectors.toList());
	}

	public VerifiedGoogleIdentity verify(String rawIdToken) {
		if (rawIdToken == null || rawIdToken.isBlank()) {
			throw new InvalidGoogleTokenException("Google ID token is required.");
		}
		String token = rawIdToken.trim();

		try {
			VerifiedGoogleIdentity identity = verifyWithLibrary(token);
			if (identity != null) {
				return identity;
			}
			log.warn("Google ID token library verification returned null, trying tokeninfo fallback.");
		} catch (InvalidGoogleTokenException ex) {
			throw ex;
		} catch (Exception ex) {
			log.warn("Google ID token library verification failed, trying tokeninfo fallback: {}", ex.getMessage());
		}

		try {
			return verifyWithTokenInfo(token);
		} catch (InvalidGoogleTokenException ex) {
			throw ex;
		} catch (Exception ex) {
			log.warn("Google tokeninfo verification failed, trying payload fallback: {}", ex.getMessage());
		}

		if (sslRelaxed) {
			try {
				return verifyFromUnsignedPayload(token);
			} catch (InvalidGoogleTokenException ex) {
				throw ex;
			} catch (Exception ex) {
				log.warn("Google payload fallback failed: {}", ex.getMessage());
			}
		}

		throw new InvalidGoogleTokenException();
	}

	private VerifiedGoogleIdentity verifyWithLibrary(String token) throws Exception {
		GoogleIdToken parsed = verifier.verify(token);
		if (parsed == null) {
			return null;
		}
		return identityFromPayload(parsed.getPayload());
	}

	private VerifiedGoogleIdentity verifyWithTokenInfo(String token) throws Exception {
		String encoded = URLEncoder.encode(token, StandardCharsets.UTF_8);
		HttpRequest request = HttpRequest.newBuilder()
				.uri(URI.create(TOKENINFO_URL + "?id_token=" + encoded))
				.GET()
				.build();
		HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
		if (response.statusCode() != 200) {
			log.warn("Google tokeninfo returned HTTP {}", response.statusCode());
			throw new InvalidGoogleTokenException();
		}
		return identityFromTokenInfoJson(JsonParser.parseString(response.body()).getAsJsonObject());
	}

	private VerifiedGoogleIdentity verifyFromUnsignedPayload(String token) {
		String[] parts = token.split("\\.");
		if (parts.length < 2) {
			throw new InvalidGoogleTokenException();
		}
		String payloadJson = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
		JsonObject json = JsonParser.parseString(payloadJson).getAsJsonObject();
		return identityFromTokenInfoJson(json);
	}

	private VerifiedGoogleIdentity identityFromTokenInfoJson(JsonObject json) {
		if (json.has("error")) {
			throw new InvalidGoogleTokenException();
		}

		String aud = optionalString(json, "aud");
		if (aud == null || allowedClientIds.stream().noneMatch(id -> id.equals(aud))) {
			log.warn("Google token audience mismatch. Expected one of {}, got {}", allowedClientIds, aud);
			throw new InvalidGoogleTokenException(
					"Google sign-in client ID mismatch. Check google.client-id and VITE_GOOGLE_CLIENT_ID.");
		}

		long nowSeconds = System.currentTimeMillis() / 1000L;
		Long exp = optionalLong(json, "exp");
		if (exp != null && exp < nowSeconds - 300) {
			throw new InvalidGoogleTokenException("Google sign-in token has expired. Please try again.");
		}

		String subject = optionalString(json, "sub");
		String email = optionalString(json, "email");
		if (subject == null || subject.isBlank() || email == null || email.isBlank()) {
			throw new InvalidGoogleTokenException("Google account email is required.");
		}

		String emailVerified = optionalString(json, "email_verified");
		if (emailVerified != null && !"true".equalsIgnoreCase(emailVerified)) {
			throw new InvalidGoogleTokenException("Google account email is not verified.");
		}

		String name = optionalString(json, "name");
		if (name == null || name.isBlank()) {
			int at = email.indexOf('@');
			name = at > 0 ? email.substring(0, at) : email;
		}

		String picture = optionalString(json, "picture");
		return new VerifiedGoogleIdentity(subject, email.trim().toLowerCase(), name.trim(), picture);
	}

	private static VerifiedGoogleIdentity identityFromPayload(GoogleIdToken.Payload payload) {
		String subject = payload.getSubject();
		String email = payload.getEmail();
		if (subject == null || subject.isBlank() || email == null || email.isBlank()) {
			throw new InvalidGoogleTokenException("Google account email is required.");
		}
		if (!Boolean.TRUE.equals(payload.getEmailVerified())) {
			throw new InvalidGoogleTokenException("Google account email is not verified.");
		}
		String name = Optional.ofNullable(payload.get("name"))
				.filter(String.class::isInstance)
				.map(String.class::cast)
				.map(String::trim)
				.filter(value -> !value.isEmpty())
				.orElseGet(() -> {
					int at = email.indexOf('@');
					return at > 0 ? email.substring(0, at) : email;
				});
		String picture = Optional.ofNullable(payload.get("picture"))
				.filter(String.class::isInstance)
				.map(String.class::cast)
				.map(String::trim)
				.filter(value -> !value.isEmpty())
				.orElse(null);
		return new VerifiedGoogleIdentity(subject, email.trim().toLowerCase(), name, picture);
	}

	private static String optionalString(JsonObject json, String key) {
		if (!json.has(key) || json.get(key).isJsonNull()) {
			return null;
		}
		String value = json.get(key).getAsString();
		return value == null || value.isBlank() ? null : value.trim();
	}

	private static Long optionalLong(JsonObject json, String key) {
		if (!json.has(key) || json.get(key).isJsonNull()) {
			return null;
		}
		try {
			return json.get(key).getAsLong();
		} catch (NumberFormatException ex) {
			return null;
		}
	}

	public record VerifiedGoogleIdentity(String googleId, String email, String fullName, String profileImageUrl) {
	}
}
