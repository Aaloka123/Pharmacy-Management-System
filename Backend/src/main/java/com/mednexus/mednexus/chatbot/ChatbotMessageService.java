package com.mednexus.mednexus.chatbot;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mednexus.mednexus.chatbot.dto.ChatbotMessageResponse;
import com.mednexus.mednexus.chatbot.dto.ChatbotProductCard;
import com.mednexus.mednexus.security.PlatformUser;
import com.mednexus.mednexus.user.Role;

@Service
public class ChatbotMessageService {

	private static final int MAX_STORED_MESSAGES = 100;
	private static final int MAX_OLLAMA_HISTORY = 20;

	private final ChatbotMessageRepository chatbotMessageRepository;
	private final ChatbotContextService chatbotContextService;

	public ChatbotMessageService(
			ChatbotMessageRepository chatbotMessageRepository,
			ChatbotContextService chatbotContextService) {
		this.chatbotMessageRepository = chatbotMessageRepository;
		this.chatbotContextService = chatbotContextService;
	}

	@Transactional(readOnly = true)
	public List<ChatbotMessageResponse> listForPrincipal(PlatformUser principal) {
		OwnerKey owner = resolveOwner(principal);
		List<ChatbotMessage> messages = chatbotMessageRepository.findByOwnerOrderByCreatedAtAsc(owner.type(), owner.id());
		if (messages.size() > MAX_STORED_MESSAGES) {
			messages = messages.subList(messages.size() - MAX_STORED_MESSAGES, messages.size());
		}
		return messages.stream().map(this::toResponse).toList();
	}

	@Transactional(readOnly = true)
	public List<ChatbotMessage> listRecentForOllama(PlatformUser principal) {
		OwnerKey owner = resolveOwner(principal);
		List<ChatbotMessage> messages = chatbotMessageRepository.findByOwnerOrderByCreatedAtAsc(owner.type(), owner.id());
		if (messages.size() <= MAX_OLLAMA_HISTORY) {
			return messages;
		}
		return messages.subList(messages.size() - MAX_OLLAMA_HISTORY, messages.size());
	}

	@Transactional
	public ChatbotMessage save(
			PlatformUser principal,
			ChatbotRole role,
			String body,
			List<ChatbotProductCard> products) {
		OwnerKey owner = resolveOwner(principal);
		ChatbotMessage message = new ChatbotMessage();
		message.setOwnerType(owner.type());
		message.setOwnerId(owner.id());
		message.setRole(role);
		message.setBody(body);
		message.setProductsJson(chatbotContextService.serializeProductIds(products));
		ChatbotMessage saved = chatbotMessageRepository.save(message);
		trimOldMessages(owner);
		return saved;
	}

	private void trimOldMessages(OwnerKey owner) {
		List<ChatbotMessage> messages = chatbotMessageRepository.findByOwnerOrderByCreatedAtAsc(owner.type(), owner.id());
		if (messages.size() <= MAX_STORED_MESSAGES) {
			return;
		}
		List<ChatbotMessage> toDelete = messages.subList(0, messages.size() - MAX_STORED_MESSAGES);
		chatbotMessageRepository.deleteAll(toDelete);
	}

	private ChatbotMessageResponse toResponse(ChatbotMessage message) {
		return new ChatbotMessageResponse(
				message.getId(),
				message.getRole() == ChatbotRole.USER ? "user" : "assistant",
				message.getBody(),
				chatbotContextService.loadProductCards(message.getProductsJson()),
				message.getCreatedAt());
	}

	private OwnerKey resolveOwner(PlatformUser principal) {
		if (principal.isVendorAccount() && principal.getAppRole() == Role.VENDOR) {
			return new OwnerKey(ChatbotOwnerType.VENDOR, principal.getSubjectId());
		}
		if (!principal.isVendorAccount() && principal.getAppRole() == Role.USER) {
			return new OwnerKey(ChatbotOwnerType.USER, principal.getSubjectId());
		}
		throw new IllegalArgumentException("Chatbot is only available for users and vendors.");
	}

	private record OwnerKey(ChatbotOwnerType type, Long id) {
	}
}
