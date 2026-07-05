package com.mednexus.mednexus.chatbot;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "mednexus.ollama")
public class OllamaProperties {

	private String baseUrl = "http://localhost:11434";
	private String chatModel = "llama3.2:3b";
	private int timeoutSeconds = 120;

	public String getBaseUrl() {
		return baseUrl == null ? "http://localhost:11434" : baseUrl.replaceAll("/$", "");
	}

	public void setBaseUrl(String baseUrl) {
		this.baseUrl = baseUrl;
	}

	public String getChatModel() {
		return chatModel == null || chatModel.isBlank() ? "llama3.2:3b" : chatModel.trim();
	}

	public void setChatModel(String chatModel) {
		this.chatModel = chatModel;
	}

	public int getTimeoutSeconds() {
		return timeoutSeconds <= 0 ? 120 : timeoutSeconds;
	}

	public void setTimeoutSeconds(int timeoutSeconds) {
		this.timeoutSeconds = timeoutSeconds;
	}
}
