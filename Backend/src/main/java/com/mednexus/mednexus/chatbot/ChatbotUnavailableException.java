package com.mednexus.mednexus.chatbot;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public class ChatbotUnavailableException extends ResponseStatusException {

	public ChatbotUnavailableException(String message) {
		super(HttpStatus.SERVICE_UNAVAILABLE, message);
	}
}
