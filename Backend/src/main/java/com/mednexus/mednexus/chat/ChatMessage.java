package com.mednexus.mednexus.chat;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "chat_message")
public class ChatMessage {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "conversation_id", nullable = false)
	private Conversation conversation;

	@Enumerated(EnumType.STRING)
	@Column(name = "sender_type", nullable = false, length = 20)
	private MessageSenderType senderType;

	@Column(name = "sender_id", nullable = false)
	private Long senderId;

	@Column(name = "body")
	private String body;

	@Column(name = "attachment_url", length = 2048)
	private String attachmentUrl;

	@Column(name = "attachment_name", length = 255)
	private String attachmentName;

	@Column(name = "attachment_mime_type", length = 120)
	private String attachmentMimeType;

	@Column(name = "reply_to_message_id")
	private Long replyToMessageId;

	@Column(name = "deleted_at")
	private Instant deletedAt;

	@Enumerated(EnumType.STRING)
	@Column(name = "deleted_by_type", length = 20)
	private MessageSenderType deletedByType;

	@Column(name = "deleted_by_id")
	private Long deletedById;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	public ChatMessage() {
	}

	@PrePersist
	void onCreate() {
		if (createdAt == null) {
			createdAt = Instant.now();
		}
	}

	public Long getId() {
		return id;
	}

	public Conversation getConversation() {
		return conversation;
	}

	public void setConversation(Conversation conversation) {
		this.conversation = conversation;
	}

	public MessageSenderType getSenderType() {
		return senderType;
	}

	public void setSenderType(MessageSenderType senderType) {
		this.senderType = senderType;
	}

	public Long getSenderId() {
		return senderId;
	}

	public void setSenderId(Long senderId) {
		this.senderId = senderId;
	}

	public String getBody() {
		return body;
	}

	public void setBody(String body) {
		this.body = body;
	}

	public String getAttachmentUrl() {
		return attachmentUrl;
	}

	public void setAttachmentUrl(String attachmentUrl) {
		this.attachmentUrl = attachmentUrl;
	}

	public String getAttachmentName() {
		return attachmentName;
	}

	public void setAttachmentName(String attachmentName) {
		this.attachmentName = attachmentName;
	}

	public String getAttachmentMimeType() {
		return attachmentMimeType;
	}

	public void setAttachmentMimeType(String attachmentMimeType) {
		this.attachmentMimeType = attachmentMimeType;
	}

	public Long getReplyToMessageId() {
		return replyToMessageId;
	}

	public void setReplyToMessageId(Long replyToMessageId) {
		this.replyToMessageId = replyToMessageId;
	}

	public Instant getDeletedAt() {
		return deletedAt;
	}

	public void setDeletedAt(Instant deletedAt) {
		this.deletedAt = deletedAt;
	}

	public MessageSenderType getDeletedByType() {
		return deletedByType;
	}

	public void setDeletedByType(MessageSenderType deletedByType) {
		this.deletedByType = deletedByType;
	}

	public Long getDeletedById() {
		return deletedById;
	}

	public void setDeletedById(Long deletedById) {
		this.deletedById = deletedById;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
