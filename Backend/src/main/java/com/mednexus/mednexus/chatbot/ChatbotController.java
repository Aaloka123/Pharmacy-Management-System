package com.mednexus.mednexus.chatbot;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mednexus.mednexus.chatbot.dto.ChatbotMessageResponse;
import com.mednexus.mednexus.chatbot.dto.ChatbotRequest;
import com.mednexus.mednexus.chatbot.dto.ChatbotResponse;
import com.mednexus.mednexus.security.PlatformUser;
import com.mednexus.mednexus.user.Role;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/chatbot")
public class ChatbotController {

	private final ChatbotService chatbotService;
	private final ChatbotMessageService chatbotMessageService;

	public ChatbotController(ChatbotService chatbotService, ChatbotMessageService chatbotMessageService) {
		this.chatbotService = chatbotService;
		this.chatbotMessageService = chatbotMessageService;
	}

	@GetMapping("/messages")
	@PreAuthorize("isAuthenticated()")
	public ResponseEntity<List<ChatbotMessageResponse>> listMessages(@AuthenticationPrincipal PlatformUser principal) {
		if (!isAllowedPrincipal(principal)) {
			return ResponseEntity.status(403).build();
		}
		return ResponseEntity.ok(chatbotMessageService.listForPrincipal(principal));
	}

	@PostMapping("/message")
	@PreAuthorize("isAuthenticated()")
	public ResponseEntity<ChatbotResponse> message(
			@AuthenticationPrincipal PlatformUser principal,
			@Valid @RequestBody ChatbotRequest request) {
		if (principal.isVendorAccount() && principal.getAppRole() == Role.VENDOR) {
			return ResponseEntity.ok(chatbotService.chatForVendor(principal, principal.getSubjectId(), request));
		}
		if (!principal.isVendorAccount() && principal.getAppRole() == Role.USER) {
			return ResponseEntity.ok(chatbotService.chatForUser(principal, request));
		}
		return ResponseEntity.status(403).build();
	}

	private static boolean isAllowedPrincipal(PlatformUser principal) {
		return (principal.isVendorAccount() && principal.getAppRole() == Role.VENDOR)
				|| (!principal.isVendorAccount() && principal.getAppRole() == Role.USER);
	}
}
