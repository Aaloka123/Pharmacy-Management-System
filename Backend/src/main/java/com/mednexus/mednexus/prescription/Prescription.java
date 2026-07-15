package com.mednexus.mednexus.prescription;

import java.time.Instant;

import com.mednexus.mednexus.user.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

@Entity
@Table(name = "prescription")
public class Prescription {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	@Column(name = "image_url", nullable = false, length = 2048)
	private String imageUrl;

	@Column(name = "full_text", nullable = false, columnDefinition = "TEXT")
	private String fullText;

	@Column(name = "medicines_json", nullable = false, columnDefinition = "TEXT")
	private String medicinesJson;

	@Column(name = "doctor_notes", columnDefinition = "TEXT")
	private String doctorNotes;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

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

	public String getImageUrl() {
		return imageUrl;
	}

	public void setImageUrl(String imageUrl) {
		this.imageUrl = imageUrl;
	}

	public String getFullText() {
		return fullText;
	}

	public void setFullText(String fullText) {
		this.fullText = fullText;
	}

	public String getMedicinesJson() {
		return medicinesJson;
	}

	public void setMedicinesJson(String medicinesJson) {
		this.medicinesJson = medicinesJson;
	}

	public String getDoctorNotes() {
		return doctorNotes;
	}

	public void setDoctorNotes(String doctorNotes) {
		this.doctorNotes = doctorNotes;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}
}
