package com.mednexus.mednexus.auth;

import java.util.Collections;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;

@Service
public class GoogleTokenVerifierService {

	private final GoogleIdTokenVerifier verifier;

	public GoogleTokenVerifierService(
			@Value("${google.client-id:98369240272-5aoh1lvk62hhl3s27bcmj5nol9v873me.apps.googleusercontent.com}") String clientId) {
		String trimmed = clientId == null ? "" : clientId.trim();
		if (trimmed.isEmpty()) {
			throw new IllegalStateException("google.client-id must be configured.");
		}
		this.verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), GsonFactory.getDefaultInstance())
				.setAudience(Collections.singletonList(trimmed))
				.build();
	}

	public VerifiedGoogleIdentity verify(String rawIdToken) {
		if (rawIdToken == null || rawIdToken.isBlank()) {
			throw new InvalidGoogleTokenException("Google ID token is required.");
		}
		try {
			GoogleIdToken token = verifier.verify(rawIdToken.trim());
			if (token == null) {
				throw new InvalidGoogleTokenException();
			}
			GoogleIdToken.Payload payload = token.getPayload();
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
					.filter(s -> !s.isEmpty())
					.orElseGet(() -> {
						int at = email.indexOf('@');
						return at > 0 ? email.substring(0, at) : email;
					});
			String picture = Optional.ofNullable(payload.get("picture"))
					.filter(String.class::isInstance)
					.map(String.class::cast)
					.map(String::trim)
					.filter(s -> !s.isEmpty())
					.orElse(null);
			return new VerifiedGoogleIdentity(subject, email.trim().toLowerCase(), name, picture);
		} catch (InvalidGoogleTokenException ex) {
			throw ex;
		} catch (Exception ex) {
			throw new InvalidGoogleTokenException();
		}
	}

	public record VerifiedGoogleIdentity(String googleId, String email, String fullName, String profileImageUrl) {
	}
}
