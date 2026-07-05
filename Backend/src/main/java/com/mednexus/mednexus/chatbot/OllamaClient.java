package com.mednexus.mednexus.chatbot;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.mednexus.mednexus.chatbot.dto.OllamaChatMessage;

@Component
public class OllamaClient {

	private static final Logger log = LoggerFactory.getLogger(OllamaClient.class);

	private static final Pattern OLLAMA_ERROR_JSON = Pattern.compile("\"error\"\\s*:\\s*\"((?:\\\\.|[^\"\\\\])*)\"");

	private final OllamaProperties properties;
	private final RestClient restClient;

	public OllamaClient(OllamaProperties properties) {
		this.properties = properties;
		SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
		requestFactory.setConnectTimeout(Duration.ofSeconds(10));
		requestFactory.setReadTimeout(Duration.ofSeconds(properties.getTimeoutSeconds()));
		this.restClient = RestClient.builder().requestFactory(requestFactory).build();
	}

	public String chat(List<OllamaChatMessage> messages) {
		return chatWithModel(properties.getChatModel(), messages, null);
	}

	public String chatWithImage(String model, String prompt, String base64Image) {
		Map<String, Object> message = new LinkedHashMap<>();
		message.put("role", "user");
		message.put("content", prompt);
		message.put("images", List.of(base64Image));
		return chatWithModel(model, List.of(), List.of(message));
	}

	private String chatWithModel(String model, List<OllamaChatMessage> messages, List<Map<String, Object>> imageMessages) {
		Map<String, Object> body = new LinkedHashMap<>();
		body.put("model", model);
		if (imageMessages != null && !imageMessages.isEmpty()) {
			body.put("messages", imageMessages);
		} else {
			body.put("messages", messages);
		}
		body.put("stream", false);

		try {
			OllamaChatResponse response = restClient.post()
					.uri(properties.getBaseUrl() + "/api/chat")
					.body(body)
					.retrieve()
					.onStatus(status -> status.isError(), (request, ollamaResponse) -> {
						String errorBody = readBody(ollamaResponse);
						log.error("Ollama chat request failed for model {}: {}", model, errorBody);
						throw new ChatbotUnavailableException(buildUnavailableMessage(model, errorBody));
					})
					.body(OllamaChatResponse.class);
			if (response == null || response.message() == null || response.message().content() == null) {
				throw new ChatbotUnavailableException("Ollama returned an empty response.");
			}
			return response.message().content().trim();
		} catch (ChatbotUnavailableException ex) {
			throw ex;
		} catch (RestClientException ex) {
			log.error("Ollama chat request failed", ex);
			throw new ChatbotUnavailableException(buildUnavailableMessage(model, ex.getMessage()));
		}
	}

	private String readBody(org.springframework.http.client.ClientHttpResponse response) {
		try {
			return new String(response.getBody().readAllBytes(), StandardCharsets.UTF_8);
		} catch (Exception ex) {
			return "HTTP error";
		}
	}

	private String buildUnavailableMessage(String model, String details) {
		String detail = extractOllamaError(details);
		if (detail.contains("unknown model architecture: 'mllama'")) {
			return "Vision model "
					+ model
					+ " is not supported by your Ollama install. Run: ollama pull moondream && set mednexus.ollama.vision-model=moondream:latest";
		}
		if (detail.contains("model") && detail.contains("not found")) {
			return "Ollama model " + model + " is not installed. Run: ollama pull " + model;
		}
		if (!detail.isBlank()) {
			return "Ollama error for model " + model + ": " + detail;
		}
		return "Local AI is unavailable. Make sure Ollama is running and the model " + model + " is installed.";
	}

	private String extractOllamaError(String raw) {
		if (raw == null || raw.isBlank()) {
			return "";
		}
		Matcher matcher = OLLAMA_ERROR_JSON.matcher(raw);
		if (matcher.find()) {
			return matcher.group(1).replace("\\n", " ").replace("\\\"", "\"").trim();
		}
		return raw.trim();
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	private record OllamaChatResponse(OllamaChatMessage message) {
	}
}
