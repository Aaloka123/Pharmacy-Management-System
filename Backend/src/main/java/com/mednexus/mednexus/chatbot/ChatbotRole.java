package com.mednexus.mednexus.chatbot;

public enum ChatbotRole {
	USER("user"),
	ASSISTANT("assistant");

	private final String ollamaRole;

	ChatbotRole(String ollamaRole) {
		this.ollamaRole = ollamaRole;
	}

	public String ollamaRole() {
		return ollamaRole;
	}
}
