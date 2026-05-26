package com.mednexus.mednexus.auth;

public class InvalidGoogleTokenException extends RuntimeException {

	public InvalidGoogleTokenException() {
		super("Google sign-in could not be verified.");
	}

	public InvalidGoogleTokenException(String message) {
		super(message);
	}
}
