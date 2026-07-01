package com.mednexus.mednexus.chat;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "chat_message_hidden")
public class ChatMessageHidden {

	@EmbeddedId
	private ChatMessageHiddenId id;

	@Column(name = "hidden_at", nullable = false, updatable = false)
	private Instant hiddenAt;

	public ChatMessageHidden() {
	}

	public ChatMessageHidden(ChatMessageHiddenId id) {
		this.id = id;
	}

	@PrePersist
	void onCreate() {
		if (hiddenAt == null) {
			hiddenAt = Instant.now();
		}
	}

	public ChatMessageHiddenId getId() {
		return id;
	}

	public void setId(ChatMessageHiddenId id) {
		this.id = id;
	}

	public Instant getHiddenAt() {
		return hiddenAt;
	}
}
