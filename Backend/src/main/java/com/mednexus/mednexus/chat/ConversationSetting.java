package com.mednexus.mednexus.chat;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

@Entity
@Table(name = "conversation_setting")
public class ConversationSetting {

	@EmbeddedId
	private ConversationSettingId id;

	@Column(nullable = false)
	private boolean pinned;

	@Column(nullable = false)
	private boolean muted;

	@Column(nullable = false)
	private boolean blocked;

	@Column(nullable = false)
	private boolean hidden;

	@Column(name = "pinned_at")
	private Instant pinnedAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	public ConversationSetting() {
	}

	public ConversationSetting(ConversationSettingId id) {
		this.id = id;
	}

	@PrePersist
	void onCreate() {
		if (updatedAt == null) {
			updatedAt = Instant.now();
		}
	}

	@PreUpdate
	void onUpdate() {
		updatedAt = Instant.now();
	}

	public ConversationSettingId getId() {
		return id;
	}

	public void setId(ConversationSettingId id) {
		this.id = id;
	}

	public boolean isPinned() {
		return pinned;
	}

	public void setPinned(boolean pinned) {
		this.pinned = pinned;
	}

	public boolean isMuted() {
		return muted;
	}

	public void setMuted(boolean muted) {
		this.muted = muted;
	}

	public boolean isBlocked() {
		return blocked;
	}

	public void setBlocked(boolean blocked) {
		this.blocked = blocked;
	}

	public boolean isHidden() {
		return hidden;
	}

	public void setHidden(boolean hidden) {
		this.hidden = hidden;
	}

	public Instant getPinnedAt() {
		return pinnedAt;
	}

	public void setPinnedAt(Instant pinnedAt) {
		this.pinnedAt = pinnedAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

	public void setUpdatedAt(Instant updatedAt) {
		this.updatedAt = updatedAt;
	}
}
