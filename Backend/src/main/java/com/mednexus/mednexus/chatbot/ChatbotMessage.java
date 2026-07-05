package com.mednexus.mednexus.chatbot;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "chatbot_message")
public class ChatbotMessage {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Enumerated(EnumType.STRING)
	@Column(name = "owner_type", nullable = false, length = 20)
	private ChatbotOwnerType ownerType;

	@Column(name = "owner_id", nullable = false)
	private Long ownerId;

	@Enumerated(EnumType.STRING)
	@Column(name = "role", nullable = false, length = 20)
	private ChatbotRole role;

	@Column(name = "body", nullable = false, columnDefinition = "TEXT")
	private String body;

	@Column(name = "products_json", columnDefinition = "TEXT")
	private String productsJson;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	public ChatbotMessage() {
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

	public ChatbotOwnerType getOwnerType() {
		return ownerType;
	}

	public void setOwnerType(ChatbotOwnerType ownerType) {
		this.ownerType = ownerType;
	}

	public Long getOwnerId() {
		return ownerId;
	}

	public void setOwnerId(Long ownerId) {
		this.ownerId = ownerId;
	}

	public ChatbotRole getRole() {
		return role;
	}

	public void setRole(ChatbotRole role) {
		this.role = role;
	}

	public String getBody() {
		return body;
	}

	public void setBody(String body) {
		this.body = body;
	}

	public String getProductsJson() {
		return productsJson;
	}

	public void setProductsJson(String productsJson) {
		this.productsJson = productsJson;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
