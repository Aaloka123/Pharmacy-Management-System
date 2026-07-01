package com.mednexus.mednexus.chat;

import org.springframework.http.HttpStatus;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import com.mednexus.mednexus.security.JwtService;
import com.mednexus.mednexus.security.PlatformUser;
import com.mednexus.mednexus.user.Role;

import io.jsonwebtoken.JwtException;

@Component
public class StompAuthChannelInterceptor implements ChannelInterceptor {

	private static final String CONVERSATION_TOPIC_PREFIX = "/topic/conversation.";

	private final JwtService jwtService;
	private final ConversationRepository conversationRepository;

	public StompAuthChannelInterceptor(JwtService jwtService, ConversationRepository conversationRepository) {
		this.jwtService = jwtService;
		this.conversationRepository = conversationRepository;
	}

	@Override
	public Message<?> preSend(Message<?> message, MessageChannel channel) {
		StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
		if (accessor == null) {
			return message;
		}

		if (StompCommand.CONNECT.equals(accessor.getCommand())) {
			PlatformUser principal = authenticate(accessor.getFirstNativeHeader("Authorization"));
			accessor.setUser(new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities()));
		}

		if (StompCommand.SUBSCRIBE.equals(accessor.getCommand()) && accessor.getUser() instanceof Authentication auth
				&& auth.getPrincipal() instanceof PlatformUser principal) {
			Long conversationId = parseConversationId(accessor.getDestination());
			if (conversationId != null) {
				requireConversationAccess(principal, conversationId);
			}
		}

		if (StompCommand.SEND.equals(accessor.getCommand()) && accessor.getUser() == null) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unauthorized WebSocket message");
		}

		return message;
	}

	private void requireConversationAccess(PlatformUser principal, Long conversationId) {
		Conversation conversation = conversationRepository.findByIdWithDetails(conversationId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
		if (principal.getAppRole() == Role.USER && !principal.isVendorAccount()
				&& conversation.getUser().getId().equals(principal.getSubjectId())) {
			return;
		}
		if (principal.getAppRole() == Role.VENDOR && principal.isVendorAccount()
				&& conversation.getVendor().getId().equals(principal.getSubjectId())) {
			return;
		}
		throw new ResponseStatusException(HttpStatus.FORBIDDEN);
	}

	private PlatformUser authenticate(String authorizationHeader) {
		if (authorizationHeader == null || authorizationHeader.isBlank()) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing Authorization header");
		}
		String token = authorizationHeader.startsWith("Bearer ") ? authorizationHeader.substring(7) : authorizationHeader;
		try {
			return jwtService.parseAccessToken(token);
		} catch (JwtException ex) {
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid token");
		}
	}

	private Long parseConversationId(String destination) {
		if (destination == null || !destination.startsWith(CONVERSATION_TOPIC_PREFIX)) {
			return null;
		}
		try {
			return Long.parseLong(destination.substring(CONVERSATION_TOPIC_PREFIX.length()));
		} catch (NumberFormatException ex) {
			return null;
		}
	}
}
