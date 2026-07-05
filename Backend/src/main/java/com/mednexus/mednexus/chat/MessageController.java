package com.mednexus.mednexus.chat;

import java.util.List;
import java.util.Map;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.mednexus.mednexus.chat.dto.AttachmentUploadResponse;
import com.mednexus.mednexus.chat.dto.ChatMessageResponse;
import com.mednexus.mednexus.chat.dto.ConversationResponse;
import com.mednexus.mednexus.chat.dto.SendMessageRequest;
import com.mednexus.mednexus.chat.dto.UnreadCountResponse;
import com.mednexus.mednexus.chat.dto.UpdateConversationSettingsRequest;
import com.mednexus.mednexus.security.PlatformUser;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

	private final MessageService messageService;

	public MessageController(MessageService messageService) {
		this.messageService = messageService;
	}

	@GetMapping("/conversations")
	@PreAuthorize("hasAnyRole('USER','VENDOR')")
	public ResponseEntity<List<ConversationResponse>> listConversations(@AuthenticationPrincipal PlatformUser principal) {
		return ResponseEntity.ok(messageService.listConversations(principal));
	}

	@PostMapping("/conversations")
	@PreAuthorize("hasRole('USER') and !principal.vendorAccount")
	public ResponseEntity<ConversationResponse> createConversation(
			@AuthenticationPrincipal PlatformUser principal,
			@RequestBody Map<String, Long> body) {
		Long vendorId = body.get("vendorId");
		if (vendorId == null) {
			return ResponseEntity.badRequest().build();
		}
		return ResponseEntity.ok(messageService.getOrCreateConversation(principal, vendorId));
	}

	@GetMapping("/conversations/{conversationId}/messages")
	@PreAuthorize("hasAnyRole('USER','VENDOR')")
	public ResponseEntity<List<ChatMessageResponse>> listMessages(
			@AuthenticationPrincipal PlatformUser principal,
			@PathVariable Long conversationId) {
		return ResponseEntity.ok(messageService.listMessages(principal, conversationId));
	}

	@PostMapping("/conversations/{conversationId}/messages")
	@PreAuthorize("hasAnyRole('USER','VENDOR')")
	public ResponseEntity<ChatMessageResponse> sendMessage(
			@AuthenticationPrincipal PlatformUser principal,
			@PathVariable Long conversationId,
			@RequestBody SendMessageRequest request) {
		return ResponseEntity.ok(messageService.sendMessage(principal, conversationId, request));
	}

	@PostMapping(value = "/conversations/{conversationId}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@PreAuthorize("hasAnyRole('USER','VENDOR')")
	public ResponseEntity<AttachmentUploadResponse> uploadAttachment(
			@AuthenticationPrincipal PlatformUser principal,
			@PathVariable Long conversationId,
			@RequestPart("file") MultipartFile file) {
		return ResponseEntity.ok(messageService.uploadAttachment(principal, conversationId, file));
	}

	@PostMapping("/conversations/{conversationId}/read")
	@PreAuthorize("hasAnyRole('USER','VENDOR')")
	public ResponseEntity<Void> markRead(
			@AuthenticationPrincipal PlatformUser principal,
			@PathVariable Long conversationId) {
		messageService.markRead(principal, conversationId);
		return ResponseEntity.noContent().build();
	}

	@PostMapping("/conversations/{conversationId}/unread")
	@PreAuthorize("hasAnyRole('USER','VENDOR')")
	public ResponseEntity<Void> markUnread(
			@AuthenticationPrincipal PlatformUser principal,
			@PathVariable Long conversationId) {
		messageService.markUnread(principal, conversationId);
		return ResponseEntity.noContent().build();
	}

	@PatchMapping("/conversations/{conversationId}/settings")
	@PreAuthorize("hasAnyRole('USER','VENDOR')")
	public ResponseEntity<ConversationResponse> updateConversationSettings(
			@AuthenticationPrincipal PlatformUser principal,
			@PathVariable Long conversationId,
			@RequestBody UpdateConversationSettingsRequest request) {
		return ResponseEntity.ok(messageService.updateConversationSettings(principal, conversationId, request));
	}

	@GetMapping("/unread-count")
	@PreAuthorize("hasAnyRole('USER','VENDOR')")
	public ResponseEntity<UnreadCountResponse> unreadCount(@AuthenticationPrincipal PlatformUser principal) {
		return ResponseEntity.ok(new UnreadCountResponse(messageService.countUnread(principal)));
	}

	@DeleteMapping("/conversations/{conversationId}/messages/{messageId}/me")
	@PreAuthorize("hasAnyRole('USER','VENDOR')")
	public ResponseEntity<Void> deleteMessageForMe(
			@AuthenticationPrincipal PlatformUser principal,
			@PathVariable Long conversationId,
			@PathVariable Long messageId) {
		messageService.deleteMessageForMe(principal, conversationId, messageId);
		return ResponseEntity.noContent().build();
	}

	@DeleteMapping("/conversations/{conversationId}/messages/{messageId}/everyone")
	@PreAuthorize("hasAnyRole('USER','VENDOR')")
	public ResponseEntity<Void> deleteMessageForEveryone(
			@AuthenticationPrincipal PlatformUser principal,
			@PathVariable Long conversationId,
			@PathVariable Long messageId) {
		messageService.deleteMessageForEveryone(principal, conversationId, messageId);
		return ResponseEntity.noContent().build();
	}
}
