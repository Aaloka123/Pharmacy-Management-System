package com.mednexus.mednexus.chat;

import java.time.Instant;

import com.mednexus.mednexus.user.User;
import com.mednexus.mednexus.vendor.Vendor;

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
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
		name = "conversation",
		uniqueConstraints = @UniqueConstraint(name = "uk_conversation_user_vendor", columnNames = { "user_id", "vendor_id" }))
public class Conversation {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "vendor_id", nullable = false)
	private Vendor vendor;

	@Column(name = "last_message_at")
	private Instant lastMessageAt;

	@Enumerated(EnumType.STRING)
	@Column(name = "last_message_sender_type", length = 20)
	private MessageSenderType lastMessageSenderType;

	@Column(name = "last_message_preview", length = 255)
	private String lastMessagePreview;

	@Column(name = "user_last_read_at")
	private Instant userLastReadAt;

	@Column(name = "vendor_last_read_at")
	private Instant vendorLastReadAt;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	public Conversation() {
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

	public User getUser() {
		return user;
	}

	public void setUser(User user) {
		this.user = user;
	}

	public Vendor getVendor() {
		return vendor;
	}

	public void setVendor(Vendor vendor) {
		this.vendor = vendor;
	}

	public Instant getLastMessageAt() {
		return lastMessageAt;
	}

	public void setLastMessageAt(Instant lastMessageAt) {
		this.lastMessageAt = lastMessageAt;
	}

	public MessageSenderType getLastMessageSenderType() {
		return lastMessageSenderType;
	}

	public void setLastMessageSenderType(MessageSenderType lastMessageSenderType) {
		this.lastMessageSenderType = lastMessageSenderType;
	}

	public String getLastMessagePreview() {
		return lastMessagePreview;
	}

	public void setLastMessagePreview(String lastMessagePreview) {
		this.lastMessagePreview = lastMessagePreview;
	}

	public Instant getUserLastReadAt() {
		return userLastReadAt;
	}

	public void setUserLastReadAt(Instant userLastReadAt) {
		this.userLastReadAt = userLastReadAt;
	}

	public Instant getVendorLastReadAt() {
		return vendorLastReadAt;
	}

	public void setVendorLastReadAt(Instant vendorLastReadAt) {
		this.vendorLastReadAt = vendorLastReadAt;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
