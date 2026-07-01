package com.mednexus.mednexus.chat;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

import com.mednexus.mednexus.chat.dto.ChatSendPayload;
import com.mednexus.mednexus.security.PlatformUser;

@Controller
public class ChatWebSocketController {

	private final MessageService messageService;

	public ChatWebSocketController(MessageService messageService) {
		this.messageService = messageService;
	}

	@MessageMapping("/chat.send")
	public void sendMessage(@Payload ChatSendPayload payload, Authentication authentication) {
		if (authentication == null || !(authentication.getPrincipal() instanceof PlatformUser principal)) {
			return;
		}
		if (payload == null || payload.conversationId() == null || payload.message() == null) {
			return;
		}
		messageService.sendMessage(principal, payload.conversationId(), payload.message());
	}
}
