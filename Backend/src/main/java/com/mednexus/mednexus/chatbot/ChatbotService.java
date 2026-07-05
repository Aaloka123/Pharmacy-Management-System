package com.mednexus.mednexus.chatbot;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mednexus.mednexus.chatbot.dto.ChatbotProductCard;
import com.mednexus.mednexus.chatbot.dto.ChatbotRequest;
import com.mednexus.mednexus.chatbot.dto.ChatbotResponse;
import com.mednexus.mednexus.chatbot.dto.OllamaChatMessage;
import com.mednexus.mednexus.security.PlatformUser;

@Service
public class ChatbotService {

	private static final String USER_SYSTEM_PROMPT = """
			You are MedNexus AI, a helpful pharmacy assistant for customers in Nepal.

			Your job:
			- Listen to symptoms the user describes (headache, fever, cough, stomach pain, etc.).
			- Explain possible common causes using cautious language such as "may", "could be", or "might".
			- Suggest general OTC options when appropriate (for example paracetamol, ORS, rest, hydration).
			- Ask 1-3 short follow-up questions when details are missing.
			- When catalog product data is provided, tell the user whether matching medicines appear to be available on MedNexus.
			- Keep answers concise, friendly, and practical.

			Safety rules:
			- Never give a definite medical diagnosis.
			- Never prescribe prescription-only medicines.
			- Tell the user to consult a doctor or pharmacist for serious, worsening, or unclear symptoms.
			- Mention pregnancy, children, allergies, or chronic conditions require professional advice.
			- End important health replies with a brief reminder that this is information only, not medical advice.
			""";

	private static final String VENDOR_SYSTEM_PROMPT = """
			You are MedNexus AI, an assistant for pharmacy vendors using the MedNexus vendor portal.

			Your job:
			- Help the vendor understand their orders, especially pending, confirmed, and shipped orders.
			- Warn about expired or inactive products and out-of-stock items.
			- Summarize customer reviews, especially unreplied reviews or low ratings.
			- Suggest practical next steps such as updating order status, restocking, removing expired items, or replying to reviews.

			Rules:
			- Use only the vendor snapshot data provided in the conversation context.
			- Do not invent orders, products, or reviews that are not in the snapshot.
			- Keep answers concise, organized, and action-oriented.
			- If data is empty for a topic, say so clearly.
			""";

	private final OllamaClient ollamaClient;
	private final ChatbotContextService contextService;
	private final ChatbotMessageService chatbotMessageService;

	public ChatbotService(
			OllamaClient ollamaClient,
			ChatbotContextService contextService,
			ChatbotMessageService chatbotMessageService) {
		this.ollamaClient = ollamaClient;
		this.contextService = contextService;
		this.chatbotMessageService = chatbotMessageService;
	}

	@Transactional
	public ChatbotResponse chatForUser(PlatformUser principal, ChatbotRequest request) {
		List<ChatbotProductCard> products = contextService.findMatchingProducts(request.message());
		String productContext = contextService.buildProductContext(products);
		String systemPrompt = USER_SYSTEM_PROMPT + "\n\n" + productContext;
		List<ChatbotMessage> history = chatbotMessageService.listRecentForOllama(principal);
		String reply = ollamaClient.chat(buildMessages(systemPrompt, history, request.message()));

		ChatbotMessage userMessage = chatbotMessageService.save(principal, ChatbotRole.USER, request.message(), null);
		ChatbotMessage assistantMessage = chatbotMessageService.save(
				principal,
				ChatbotRole.ASSISTANT,
				reply,
				products);

		return new ChatbotResponse(
				reply,
				products,
				userMessage.getId(),
				assistantMessage.getId(),
				userMessage.getCreatedAt(),
				assistantMessage.getCreatedAt());
	}

	@Transactional
	public ChatbotResponse chatForVendor(PlatformUser principal, Long vendorId, ChatbotRequest request) {
		String vendorContext = contextService.buildVendorContext(vendorId);
		String systemPrompt = VENDOR_SYSTEM_PROMPT + "\n\n" + vendorContext;
		List<ChatbotMessage> history = chatbotMessageService.listRecentForOllama(principal);
		String reply = ollamaClient.chat(buildMessages(systemPrompt, history, request.message()));

		ChatbotMessage userMessage = chatbotMessageService.save(principal, ChatbotRole.USER, request.message(), null);
		ChatbotMessage assistantMessage = chatbotMessageService.save(
				principal,
				ChatbotRole.ASSISTANT,
				reply,
				List.of());

		return new ChatbotResponse(
				reply,
				List.of(),
				userMessage.getId(),
				assistantMessage.getId(),
				userMessage.getCreatedAt(),
				assistantMessage.getCreatedAt());
	}

	private List<OllamaChatMessage> buildMessages(
			String systemPrompt,
			List<ChatbotMessage> history,
			String userMessage) {
		List<OllamaChatMessage> messages = new ArrayList<>();
		messages.add(new OllamaChatMessage("system", systemPrompt));
		for (ChatbotMessage item : history) {
			messages.add(new OllamaChatMessage(item.getRole().ollamaRole(), item.getBody()));
		}
		messages.add(new OllamaChatMessage("user", userMessage));
		return messages;
	}
}
