package com.mednexus.mednexus.chat;

import java.io.Serializable;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

@Embeddable
public class ChatMessageHiddenId implements Serializable {

	@Column(name = "message_id")
	private Long messageId;

	@Enumerated(EnumType.STRING)
	@Column(name = "hider_type", length = 20)
	private MessageSenderType hiderType;

	@Column(name = "hider_id")
	private Long hiderId;

	public ChatMessageHiddenId() {
	}

	public ChatMessageHiddenId(Long messageId, MessageSenderType hiderType, Long hiderId) {
		this.messageId = messageId;
		this.hiderType = hiderType;
		this.hiderId = hiderId;
	}

	public Long getMessageId() {
		return messageId;
	}

	public void setMessageId(Long messageId) {
		this.messageId = messageId;
	}

	public MessageSenderType getHiderType() {
		return hiderType;
	}

	public void setHiderType(MessageSenderType hiderType) {
		this.hiderType = hiderType;
	}

	public Long getHiderId() {
		return hiderId;
	}

	public void setHiderId(Long hiderId) {
		this.hiderId = hiderId;
	}

	@Override
	public boolean equals(Object other) {
		if (this == other) {
			return true;
		}
		if (!(other instanceof ChatMessageHiddenId that)) {
			return false;
		}
		return Objects.equals(messageId, that.messageId)
				&& hiderType == that.hiderType
				&& Objects.equals(hiderId, that.hiderId);
	}

	@Override
	public int hashCode() {
		return Objects.hash(messageId, hiderType, hiderId);
	}
}
