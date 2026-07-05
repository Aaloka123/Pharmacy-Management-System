package com.mednexus.mednexus.chatbot;

import java.time.Duration;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

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
		Map<String, Object> body = new LinkedHashMap<>();
		body.put("model", properties.getChatModel());
		body.put("messages", messages);
		body.put("stream", false);

		try {
			OllamaChatResponse response = restClient.post()
					.uri(properties.getBaseUrl() + "/api/chat")
					.body(body)
					.retrieve()
					.body(OllamaChatResponse.class);
			if (response == null || response.message() == null || response.message().content() == null) {
				throw new ChatbotUnavailableException("Ollama returned an empty response.");
			}
			return response.message().content().trim();
		} catch (RestClientException ex) {
			log.error("Ollama chat request failed", ex);
			throw new ChatbotUnavailableException(
					"Local AI is unavailable. Make sure Ollama is running and the model "
							+ properties.getChatModel()
							+ " is installed.");
		}
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	private record OllamaChatResponse(OllamaChatMessage message) {
	}
}
