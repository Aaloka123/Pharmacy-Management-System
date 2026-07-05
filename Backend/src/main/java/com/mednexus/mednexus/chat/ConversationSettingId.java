package com.mednexus.mednexus.chat;

import java.io.Serializable;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

@Embeddable
public class ConversationSettingId implements Serializable {

	@Column(name = "conversation_id", nullable = false)
	private Long conversationId;

	@Enumerated(EnumType.STRING)
	@Column(name = "viewer_type", nullable = false, length = 20)
	private MessageSenderType viewerType;

	@Column(name = "viewer_id", nullable = false)
	private Long viewerId;

	public ConversationSettingId() {
	}

	public ConversationSettingId(Long conversationId, MessageSenderType viewerType, Long viewerId) {
		this.conversationId = conversationId;
		this.viewerType = viewerType;
		this.viewerId = viewerId;
	}

	public Long getConversationId() {
		return conversationId;
	}

	public void setConversationId(Long conversationId) {
		this.conversationId = conversationId;
	}

	public MessageSenderType getViewerType() {
		return viewerType;
	}

	public void setViewerType(MessageSenderType viewerType) {
		this.viewerType = viewerType;
	}

	public Long getViewerId() {
		return viewerId;
	}

	public void setViewerId(Long viewerId) {
		this.viewerId = viewerId;
	}

	@Override
	public boolean equals(Object other) {
		if (this == other) {
			return true;
		}
		if (!(other instanceof ConversationSettingId that)) {
			return false;
		}
		return Objects.equals(conversationId, that.conversationId)
				&& viewerType == that.viewerType
				&& Objects.equals(viewerId, that.viewerId);
	}

	@Override
	public int hashCode() {
		return Objects.hash(conversationId, viewerType, viewerId);
	}
}
