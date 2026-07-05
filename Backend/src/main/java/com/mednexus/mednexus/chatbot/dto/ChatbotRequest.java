package com.mednexus.mednexus.chatbot.dto;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ChatbotRequest(
		@NotBlank @Size(max = 2000) String message,
		@Size(max = 12) List<ChatbotHistoryMessage> history) {
}
