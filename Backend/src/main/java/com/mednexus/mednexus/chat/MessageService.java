package com.mednexus.mednexus.chat;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.mednexus.mednexus.chat.dto.AttachmentUploadResponse;
import com.mednexus.mednexus.chat.dto.ChatMessageResponse;
import com.mednexus.mednexus.chat.dto.ChatMessageResponse.MessageSenderTypeDto;
import com.mednexus.mednexus.chat.dto.ConversationResponse;
import com.mednexus.mednexus.chat.dto.SendMessageRequest;
import com.mednexus.mednexus.security.PlatformUser;
import com.mednexus.mednexus.user.Role;
import com.mednexus.mednexus.user.User;
import com.mednexus.mednexus.user.UserRepository;
import com.mednexus.mednexus.vendor.Vendor;
import com.mednexus.mednexus.vendor.VendorRepository;
import com.mednexus.mednexus.vendor.VendorStatus;

@Service
public class MessageService {

	private static final DateTimeFormatter ISO_FORMAT =
			DateTimeFormatter.ISO_OFFSET_DATE_TIME.withZone(ZoneOffset.UTC);

	private final ConversationRepository conversationRepository;
	private final ChatMessageRepository chatMessageRepository;
	private final UserRepository userRepository;
	private final VendorRepository vendorRepository;
	private final MessageFileStorage messageFileStorage;
	private final SimpMessagingTemplate messagingTemplate;

	public MessageService(
			ConversationRepository conversationRepository,
			ChatMessageRepository chatMessageRepository,
			UserRepository userRepository,
			VendorRepository vendorRepository,
			MessageFileStorage messageFileStorage,
			SimpMessagingTemplate messagingTemplate) {
		this.conversationRepository = conversationRepository;
		this.chatMessageRepository = chatMessageRepository;
		this.userRepository = userRepository;
		this.vendorRepository = vendorRepository;
		this.messageFileStorage = messageFileStorage;
		this.messagingTemplate = messagingTemplate;
	}

	@Transactional(readOnly = true)
	public List<ConversationResponse> listConversations(PlatformUser principal) {
		if (principal.getAppRole() == Role.USER && !principal.isVendorAccount()) {
			return conversationRepository.findByUserIdWithDetails(principal.getSubjectId()).stream()
					.sorted(conversationRecencyComparator())
					.map(conversation -> toConversationResponse(conversation, true))
					.toList();
		}
		if (principal.getAppRole() == Role.VENDOR && principal.isVendorAccount()) {
			return conversationRepository.findByVendorIdWithDetails(principal.getSubjectId()).stream()
					.sorted(conversationRecencyComparator())
					.map(conversation -> toConversationResponse(conversation, false))
					.toList();
		}
		throw new ResponseStatusException(HttpStatus.FORBIDDEN);
	}

	@Transactional
	public ConversationResponse getOrCreateConversation(PlatformUser principal, Long vendorId) {
		if (principal.getAppRole() != Role.USER || principal.isVendorAccount()) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN);
		}
		Vendor vendor = vendorRepository.findById(vendorId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vendor not found"));
		if (vendor.getStatus() != VendorStatus.APPROVED) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Vendor is not available for messaging");
		}
		User user = userRepository.findById(principal.getSubjectId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
		Conversation conversation = conversationRepository.findByUserIdAndVendorId(user.getId(), vendor.getId())
				.orElseGet(() -> {
					Conversation created = new Conversation();
					created.setUser(user);
					created.setVendor(vendor);
					return conversationRepository.save(created);
				});
		return toConversationResponse(conversation, true);
	}

	@Transactional(readOnly = true)
	public List<ChatMessageResponse> listMessages(PlatformUser principal, Long conversationId) {
		Conversation conversation = requireConversationAccess(principal, conversationId);
		return chatMessageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId()).stream()
				.map(this::toMessageResponse)
				.toList();
	}

	@Transactional
	public ChatMessageResponse sendMessage(PlatformUser principal, Long conversationId, SendMessageRequest request) {
		Conversation conversation = requireConversationAccess(principal, conversationId);
		MessageSenderType senderType = resolveSenderType(principal);
		long senderId = principal.getSubjectId();

		String body = request.body() != null ? request.body().trim() : null;
		if ((body == null || body.isBlank()) && (request.attachmentUrl() == null || request.attachmentUrl().isBlank())) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message text or attachment is required");
		}

		ChatMessage message = new ChatMessage();
		message.setConversation(conversation);
		message.setSenderType(senderType);
		message.setSenderId(senderId);
		message.setBody(body != null && !body.isBlank() ? body : null);
		message.setAttachmentUrl(blankToNull(request.attachmentUrl()));
		message.setAttachmentName(blankToNull(request.attachmentName()));
		message.setAttachmentMimeType(blankToNull(request.attachmentMimeType()));
		message.setReplyToMessageId(request.replyToMessageId());
		ChatMessage saved = chatMessageRepository.save(message);

		conversation.setLastMessageAt(saved.getCreatedAt());
		conversation.setLastMessageSenderType(senderType);
		conversation.setLastMessagePreview(buildPreview(saved));
		conversationRepository.save(conversation);

		ChatMessageResponse response = toMessageResponse(saved);
		messagingTemplate.convertAndSend("/topic/conversation." + conversationId, response);
		return response;
	}

	@Transactional
	public AttachmentUploadResponse uploadAttachment(
			PlatformUser principal,
			Long conversationId,
			MultipartFile file) {
		requireConversationAccess(principal, conversationId);
		String url = messageFileStorage.store(file, conversationId, principal.getSubjectId());
		String mimeType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";
		String fileName = file.getOriginalFilename() != null ? file.getOriginalFilename() : "attachment";
		return new AttachmentUploadResponse(url, fileName, mimeType, attachmentKind(mimeType));
	}

	@Transactional
	public void markRead(PlatformUser principal, Long conversationId) {
		Conversation conversation = requireConversationAccess(principal, conversationId);
		Instant now = Instant.now();
		if (principal.getAppRole() == Role.USER && !principal.isVendorAccount()) {
			conversation.setUserLastReadAt(now);
		} else {
			conversation.setVendorLastReadAt(now);
		}
		conversationRepository.save(conversation);
	}

	@Transactional(readOnly = true)
	public long countUnread(PlatformUser principal) {
		if (principal.getAppRole() == Role.USER && !principal.isVendorAccount()) {
			return conversationRepository.findByUserIdWithDetails(principal.getSubjectId()).stream()
					.mapToLong(conversation -> countUnreadForUser(conversation))
					.sum();
		}
		if (principal.getAppRole() == Role.VENDOR && principal.isVendorAccount()) {
			return conversationRepository.findByVendorIdWithDetails(principal.getSubjectId()).stream()
					.mapToLong(conversation -> countUnreadForVendor(conversation))
					.sum();
		}
		return 0;
	}

	private Conversation requireConversationAccess(PlatformUser principal, Long conversationId) {
		Conversation conversation = conversationRepository.findByIdWithDetails(conversationId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
		if (principal.getAppRole() == Role.USER && !principal.isVendorAccount()
				&& conversation.getUser().getId().equals(principal.getSubjectId())) {
			return conversation;
		}
		if (principal.getAppRole() == Role.VENDOR && principal.isVendorAccount()
				&& conversation.getVendor().getId().equals(principal.getSubjectId())) {
			return conversation;
		}
		throw new ResponseStatusException(HttpStatus.FORBIDDEN);
	}

	private MessageSenderType resolveSenderType(PlatformUser principal) {
		if (principal.getAppRole() == Role.VENDOR && principal.isVendorAccount()) {
			return MessageSenderType.VENDOR;
		}
		if (principal.getAppRole() == Role.USER && !principal.isVendorAccount()) {
			return MessageSenderType.USER;
		}
		throw new ResponseStatusException(HttpStatus.FORBIDDEN);
	}

	private ConversationResponse toConversationResponse(Conversation conversation, boolean userView) {
		long unread = userView ? countUnreadForUser(conversation) : countUnreadForVendor(conversation);
		if (userView) {
			Vendor vendor = conversation.getVendor();
			return new ConversationResponse(
					conversation.getId(),
					vendor.getId(),
					vendor.getBusinessName(),
					vendor.getProfileImage(),
					conversation.getLastMessagePreview(),
					formatInstant(conversation.getLastMessageAt()),
					unread);
		}
		User user = conversation.getUser();
		return new ConversationResponse(
				conversation.getId(),
				user.getId(),
				user.getFullName(),
				user.getProfileImage(),
				conversation.getLastMessagePreview(),
				formatInstant(conversation.getLastMessageAt()),
				unread);
	}

	private long countUnreadForUser(Conversation conversation) {
		Instant lastRead = conversation.getUserLastReadAt() != null
				? conversation.getUserLastReadAt()
				: Instant.EPOCH;
		return chatMessageRepository.countByConversationIdAndSenderTypeAndCreatedAtAfter(
				conversation.getId(), MessageSenderType.VENDOR, lastRead);
	}

	private long countUnreadForVendor(Conversation conversation) {
		Instant lastRead = conversation.getVendorLastReadAt() != null
				? conversation.getVendorLastReadAt()
				: Instant.EPOCH;
		return chatMessageRepository.countByConversationIdAndSenderTypeAndCreatedAtAfter(
				conversation.getId(), MessageSenderType.USER, lastRead);
	}

	private ChatMessageResponse toMessageResponse(ChatMessage message) {
		String mimeType = message.getAttachmentMimeType();
		return new ChatMessageResponse(
				message.getId(),
				message.getConversation().getId(),
				MessageSenderTypeDto.valueOf(message.getSenderType().name()),
				message.getSenderId(),
				message.getBody(),
				message.getAttachmentUrl(),
				message.getAttachmentName(),
				mimeType,
				mimeType != null ? attachmentKind(mimeType) : null,
				message.getReplyToMessageId(),
				formatInstant(message.getCreatedAt()));
	}

	private String buildPreview(ChatMessage message) {
		if (message.getBody() != null && !message.getBody().isBlank()) {
			String trimmed = message.getBody().trim();
			return trimmed.length() > 120 ? trimmed.substring(0, 117) + "..." : trimmed;
		}
		if (message.getAttachmentMimeType() != null && message.getAttachmentMimeType().startsWith("image/")) {
			return "Photo";
		}
		if ("application/pdf".equals(message.getAttachmentMimeType())) {
			return "PDF document";
		}
		return "Attachment";
	}

	private String attachmentKind(String mimeType) {
		if (mimeType.startsWith("image/")) {
			return "image";
		}
		if ("application/pdf".equals(mimeType)) {
			return "pdf";
		}
		return "file";
	}

	private String formatInstant(Instant instant) {
		return instant != null ? ISO_FORMAT.format(instant) : null;
	}

	private String blankToNull(String value) {
		return value == null || value.isBlank() ? null : value.trim();
	}

	private Comparator<Conversation> conversationRecencyComparator() {
		return Comparator.comparing(
				(Conversation conversation) -> conversation.getLastMessageAt() != null
						? conversation.getLastMessageAt()
						: conversation.getCreatedAt())
				.reversed();
	}
}
