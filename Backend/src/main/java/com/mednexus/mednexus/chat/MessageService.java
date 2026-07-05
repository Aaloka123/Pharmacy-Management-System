package com.mednexus.mednexus.chat;

import java.time.Instant;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.mednexus.mednexus.chat.dto.AttachmentUploadResponse;
import com.mednexus.mednexus.chat.dto.ChatMessageDeleteEvent;
import com.mednexus.mednexus.chat.dto.ChatMessageResponse;
import com.mednexus.mednexus.chat.dto.ChatMessageResponse.MessageSenderTypeDto;
import com.mednexus.mednexus.chat.dto.ConversationResponse;
import com.mednexus.mednexus.chat.dto.SendMessageRequest;
import com.mednexus.mednexus.chat.dto.UpdateConversationSettingsRequest;
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
	private final ChatMessageHiddenRepository chatMessageHiddenRepository;
	private final ConversationSettingRepository conversationSettingRepository;
	private final UserRepository userRepository;
	private final VendorRepository vendorRepository;
	private final MessageFileStorage messageFileStorage;
	private final SimpMessagingTemplate messagingTemplate;

	public MessageService(
			ConversationRepository conversationRepository,
			ChatMessageRepository chatMessageRepository,
			ChatMessageHiddenRepository chatMessageHiddenRepository,
			ConversationSettingRepository conversationSettingRepository,
			UserRepository userRepository,
			VendorRepository vendorRepository,
			MessageFileStorage messageFileStorage,
			SimpMessagingTemplate messagingTemplate) {
		this.conversationRepository = conversationRepository;
		this.chatMessageRepository = chatMessageRepository;
		this.chatMessageHiddenRepository = chatMessageHiddenRepository;
		this.conversationSettingRepository = conversationSettingRepository;
		this.userRepository = userRepository;
		this.vendorRepository = vendorRepository;
		this.messageFileStorage = messageFileStorage;
		this.messagingTemplate = messagingTemplate;
	}

	@Transactional(readOnly = true)
	public List<ConversationResponse> listConversations(PlatformUser principal) {
		if (principal.getAppRole() == Role.USER && !principal.isVendorAccount()) {
			return buildConversationResponses(
					conversationRepository.findByUserIdWithDetails(principal.getSubjectId()),
					true,
					MessageSenderType.USER,
					principal.getSubjectId());
		}
		if (principal.getAppRole() == Role.VENDOR && principal.isVendorAccount()) {
			return buildConversationResponses(
					conversationRepository.findByVendorIdWithDetails(principal.getSubjectId()),
					false,
					MessageSenderType.VENDOR,
					principal.getSubjectId());
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
		return toConversationResponse(conversation, true, null);
	}

	@Transactional(readOnly = true)
	public List<ChatMessageResponse> listMessages(PlatformUser principal, Long conversationId) {
		Conversation conversation = requireConversationAccess(principal, conversationId);
		MessageSenderType viewerType = resolveSenderType(principal);
		Long viewerId = principal.getSubjectId();
		Set<Long> hiddenIds = chatMessageHiddenRepository.findHiddenMessageIds(
				conversation.getId(), viewerType, viewerId);
		return chatMessageRepository.findByConversationIdOrderByCreatedAtAsc(conversation.getId()).stream()
				.filter(message -> !hiddenIds.contains(message.getId()))
				.map(this::toMessageResponse)
				.toList();
	}

	@Transactional
	public ChatMessageResponse sendMessage(PlatformUser principal, Long conversationId, SendMessageRequest request) {
		Conversation conversation = requireConversationAccess(principal, conversationId);
		MessageSenderType senderType = resolveSenderType(principal);
		long senderId = principal.getSubjectId();
		assertNotBlocked(conversation, senderType, senderId);

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

		unhideConversationForRecipient(conversation, senderType);

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

	@Transactional
	public void markUnread(PlatformUser principal, Long conversationId) {
		Conversation conversation = requireConversationAccess(principal, conversationId);
		if (principal.getAppRole() == Role.USER && !principal.isVendorAccount()) {
			conversation.setUserLastReadAt(Instant.EPOCH);
		} else {
			conversation.setVendorLastReadAt(Instant.EPOCH);
		}
		conversationRepository.save(conversation);
	}

	@Transactional
	public ConversationResponse updateConversationSettings(
			PlatformUser principal,
			Long conversationId,
			UpdateConversationSettingsRequest request) {
		Conversation conversation = requireConversationAccess(principal, conversationId);
		boolean userView = principal.getAppRole() == Role.USER && !principal.isVendorAccount();
		MessageSenderType viewerType = resolveSenderType(principal);
		Long viewerId = principal.getSubjectId();
		ConversationSetting setting = getOrCreateSetting(conversation.getId(), viewerType, viewerId);

		if (request.pinned() != null) {
			setting.setPinned(request.pinned());
			setting.setPinnedAt(request.pinned() ? Instant.now() : null);
		}
		if (request.muted() != null) {
			setting.setMuted(request.muted());
		}
		if (request.blocked() != null) {
			setting.setBlocked(request.blocked());
		}
		if (request.hidden() != null) {
			setting.setHidden(request.hidden());
		}
		conversationSettingRepository.save(setting);
		return toConversationResponse(conversation, userView, setting);
	}

	@Transactional(readOnly = true)
	public long countUnread(PlatformUser principal) {
		if (principal.getAppRole() == Role.USER && !principal.isVendorAccount()) {
			return countUnreadForViewer(
					conversationRepository.findByUserIdWithDetails(principal.getSubjectId()),
					MessageSenderType.USER,
					principal.getSubjectId(),
					true);
		}
		if (principal.getAppRole() == Role.VENDOR && principal.isVendorAccount()) {
			return countUnreadForViewer(
					conversationRepository.findByVendorIdWithDetails(principal.getSubjectId()),
					MessageSenderType.VENDOR,
					principal.getSubjectId(),
					false);
		}
		return 0;
	}

	@Transactional
	public void deleteMessageForMe(PlatformUser principal, Long conversationId, Long messageId) {
		Conversation conversation = requireConversationAccess(principal, conversationId);
		ChatMessage message = requireMessageInConversation(conversation, messageId);
		MessageSenderType hiderType = resolveSenderType(principal);
		Long hiderId = principal.getSubjectId();
		if (chatMessageHiddenRepository.existsByIdMessageIdAndIdHiderTypeAndIdHiderId(
				message.getId(), hiderType, hiderId)) {
			return;
		}
		chatMessageHiddenRepository.save(new ChatMessageHidden(
				new ChatMessageHiddenId(message.getId(), hiderType, hiderId)));
	}

	@Transactional
	public void deleteMessageForEveryone(PlatformUser principal, Long conversationId, Long messageId) {
		Conversation conversation = requireConversationAccess(principal, conversationId);
		ChatMessage message = requireMessageInConversation(conversation, messageId);
		MessageSenderType senderType = resolveSenderType(principal);
		if (message.getDeletedAt() != null) {
			return;
		}
		if (!message.getSenderType().equals(senderType) || !message.getSenderId().equals(principal.getSubjectId())) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only the sender can delete for everyone");
		}

		String attachmentUrl = message.getAttachmentUrl();
		message.setDeletedAt(Instant.now());
		message.setDeletedByType(senderType);
		message.setDeletedById(principal.getSubjectId());
		message.setBody(null);
		message.setAttachmentUrl(null);
		message.setAttachmentName(null);
		message.setAttachmentMimeType(null);
		chatMessageRepository.save(message);

		if (attachmentUrl != null && !attachmentUrl.isBlank()) {
			messageFileStorage.deleteByUrl(attachmentUrl);
		}

		refreshConversationPreview(conversation);
		conversationRepository.save(conversation);

		ChatMessageResponse tombstone = toMessageResponse(message);
		messagingTemplate.convertAndSend(
				"/topic/conversation." + conversationId,
				new ChatMessageDeleteEvent("DELETE_FOR_EVERYONE", tombstone));
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

	private ConversationResponse toConversationResponse(
			Conversation conversation,
			boolean userView,
			ConversationSetting setting) {
		long unread = userView ? countUnreadForUser(conversation) : countUnreadForVendor(conversation);
		boolean pinned = setting != null && setting.isPinned();
		boolean muted = setting != null && setting.isMuted();
		boolean blocked = setting != null && setting.isBlocked();
		if (userView) {
			Vendor vendor = conversation.getVendor();
			return new ConversationResponse(
					conversation.getId(),
					vendor.getId(),
					vendor.getBusinessName(),
					vendor.getProfileImage(),
					conversation.getLastMessagePreview(),
					formatInstant(conversation.getLastMessageAt()),
					unread,
					pinned,
					muted,
					blocked);
		}
		User user = conversation.getUser();
		return new ConversationResponse(
				conversation.getId(),
				user.getId(),
				user.getFullName(),
				user.getProfileImage(),
				conversation.getLastMessagePreview(),
				formatInstant(conversation.getLastMessageAt()),
				unread,
				pinned,
				muted,
				blocked);
	}

	private List<ConversationResponse> buildConversationResponses(
			List<Conversation> conversations,
			boolean userView,
			MessageSenderType viewerType,
			Long viewerId) {
		Map<Long, ConversationSetting> settingsByConversationId = loadSettingsByConversationId(
				conversations,
				viewerType,
				viewerId);
		return conversations.stream()
				.filter(conversation -> !isHidden(settingsByConversationId.get(conversation.getId())))
				.sorted(conversationListComparator(settingsByConversationId))
				.map(conversation -> toConversationResponse(
						conversation,
						userView,
						settingsByConversationId.get(conversation.getId())))
				.toList();
	}

	private Map<Long, ConversationSetting> loadSettingsByConversationId(
			List<Conversation> conversations,
			MessageSenderType viewerType,
			Long viewerId) {
		if (conversations.isEmpty()) {
			return Map.of();
		}
		List<Long> conversationIds = conversations.stream().map(Conversation::getId).toList();
		return conversationSettingRepository
				.findByIdConversationIdInAndIdViewerTypeAndIdViewerId(conversationIds, viewerType, viewerId)
				.stream()
				.collect(Collectors.toMap(setting -> setting.getId().getConversationId(), Function.identity()));
	}

	private long countUnreadForViewer(
			List<Conversation> conversations,
			MessageSenderType viewerType,
			Long viewerId,
			boolean userView) {
		Map<Long, ConversationSetting> settingsByConversationId = loadSettingsByConversationId(
				conversations,
				viewerType,
				viewerId);
		return conversations.stream()
				.filter(conversation -> !isMuted(settingsByConversationId.get(conversation.getId())))
				.mapToLong(conversation -> userView
						? countUnreadForUser(conversation)
						: countUnreadForVendor(conversation))
				.sum();
	}

	private ConversationSetting getOrCreateSetting(
			Long conversationId,
			MessageSenderType viewerType,
			Long viewerId) {
		return conversationSettingRepository
				.findByIdConversationIdAndIdViewerTypeAndIdViewerId(conversationId, viewerType, viewerId)
				.orElseGet(() -> new ConversationSetting(new ConversationSettingId(conversationId, viewerType, viewerId)));
	}

	private void assertNotBlocked(Conversation conversation, MessageSenderType senderType, long senderId) {
		ConversationSetting setting = conversationSettingRepository
				.findByIdConversationIdAndIdViewerTypeAndIdViewerId(
						conversation.getId(), senderType, senderId)
				.orElse(null);
		if (setting != null && setting.isBlocked()) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You blocked this conversation");
		}
	}

	private void unhideConversationForRecipient(Conversation conversation, MessageSenderType senderType) {
		MessageSenderType recipientType = senderType == MessageSenderType.USER
				? MessageSenderType.VENDOR
				: MessageSenderType.USER;
		Long recipientId = senderType == MessageSenderType.USER
				? conversation.getVendor().getId()
				: conversation.getUser().getId();
		conversationSettingRepository
				.findByIdConversationIdAndIdViewerTypeAndIdViewerId(
						conversation.getId(), recipientType, recipientId)
				.filter(ConversationSetting::isHidden)
				.ifPresent(setting -> {
					setting.setHidden(false);
					conversationSettingRepository.save(setting);
				});
	}

	private boolean isHidden(ConversationSetting setting) {
		return setting != null && setting.isHidden();
	}

	private boolean isMuted(ConversationSetting setting) {
		return setting != null && setting.isMuted();
	}

	private Comparator<Conversation> conversationListComparator(Map<Long, ConversationSetting> settingsByConversationId) {
		return (left, right) -> {
			ConversationSetting leftSetting = settingsByConversationId.get(left.getId());
			ConversationSetting rightSetting = settingsByConversationId.get(right.getId());
			boolean leftPinned = leftSetting != null && leftSetting.isPinned();
			boolean rightPinned = rightSetting != null && rightSetting.isPinned();
			if (leftPinned != rightPinned) {
				return leftPinned ? -1 : 1;
			}
			if (leftPinned && rightPinned) {
				Instant leftPinnedAt = leftSetting.getPinnedAt();
				Instant rightPinnedAt = rightSetting.getPinnedAt();
				if (leftPinnedAt != null && rightPinnedAt != null) {
					int pinnedCompare = rightPinnedAt.compareTo(leftPinnedAt);
					if (pinnedCompare != 0) {
						return pinnedCompare;
					}
				}
			}
			return conversationRecencyComparator().compare(left, right);
		};
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
		boolean deleted = message.getDeletedAt() != null;
		String mimeType = deleted ? null : message.getAttachmentMimeType();
		return new ChatMessageResponse(
				message.getId(),
				message.getConversation().getId(),
				MessageSenderTypeDto.valueOf(message.getSenderType().name()),
				message.getSenderId(),
				deleted ? null : message.getBody(),
				deleted ? null : message.getAttachmentUrl(),
				deleted ? null : message.getAttachmentName(),
				mimeType,
				mimeType != null ? attachmentKind(mimeType) : null,
				message.getReplyToMessageId(),
				formatInstant(message.getCreatedAt()),
				deleted);
	}

	private ChatMessage requireMessageInConversation(Conversation conversation, Long messageId) {
		return chatMessageRepository.findByIdAndConversationId(messageId, conversation.getId())
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Message not found"));
	}

	private void refreshConversationPreview(Conversation conversation) {
		chatMessageRepository.findTopByConversationIdAndDeletedAtIsNullOrderByCreatedAtDesc(conversation.getId())
				.ifPresentOrElse(latest -> {
					conversation.setLastMessageAt(latest.getCreatedAt());
					conversation.setLastMessageSenderType(latest.getSenderType());
					conversation.setLastMessagePreview(buildPreview(latest));
				}, () -> {
					conversation.setLastMessageAt(null);
					conversation.setLastMessageSenderType(null);
					conversation.setLastMessagePreview(null);
				});
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
