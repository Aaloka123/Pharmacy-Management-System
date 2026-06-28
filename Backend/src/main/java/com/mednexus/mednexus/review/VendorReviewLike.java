package com.mednexus.mednexus.review;

import java.time.Instant;

import com.mednexus.mednexus.vendor.Vendor;

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
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
		name = "vendor_review_like",
		uniqueConstraints = @UniqueConstraint(name = "uk_vendor_review_like", columnNames = { "review_id", "vendor_id" }))
public class VendorReviewLike {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "review_id", nullable = false)
	private ProductReview review;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "vendor_id", nullable = false)
	private Vendor vendor;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	public VendorReviewLike() {
	}

	@PrePersist
	void onCreate() {
		if (createdAt == null) {
			createdAt = Instant.now();
		}
	}

	public ProductReview getReview() {
		return review;
	}

	public void setReview(ProductReview review) {
		this.review = review;
	}

	public Vendor getVendor() {
		return vendor;
	}

	public void setVendor(Vendor vendor) {
		this.vendor = vendor;
	}
}
