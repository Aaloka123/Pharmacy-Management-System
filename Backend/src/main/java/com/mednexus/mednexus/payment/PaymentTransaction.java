package com.mednexus.mednexus.payment;

import java.math.BigDecimal;
import java.time.Instant;

import com.mednexus.mednexus.user.User;

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
@Table(name = "payment_transaction")
public class PaymentTransaction {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	@Column(name = "transaction_uuid", nullable = false, unique = true, length = 64)
	private String transactionUuid;

	@Column(name = "amount", nullable = false, precision = 12, scale = 2)
	private BigDecimal amount;

	@Column(name = "tax_amount", nullable = false, precision = 12, scale = 2)
	private BigDecimal taxAmount;

	@Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
	private BigDecimal totalAmount;

	@Column(name = "cart_item_ids", nullable = false, length = 2000)
	private String cartItemIds;

	@Enumerated(EnumType.STRING)
	@Column(name = "status", nullable = false, length = 20)
	private PaymentStatus status = PaymentStatus.PENDING;

	@Enumerated(EnumType.STRING)
	@Column(name = "provider", nullable = false, length = 20)
	private PaymentProvider provider = PaymentProvider.ESEWA;

	@Column(name = "pidx", length = 64)
	private String pidx;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@Column(name = "completed_at")
	private Instant completedAt;

	public PaymentTransaction() {
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

	public void setId(Long id) {
		this.id = id;
	}

	public User getUser() {
		return user;
	}

	public void setUser(User user) {
		this.user = user;
	}

	public String getTransactionUuid() {
		return transactionUuid;
	}

	public void setTransactionUuid(String transactionUuid) {
		this.transactionUuid = transactionUuid;
	}

	public BigDecimal getAmount() {
		return amount;
	}

	public void setAmount(BigDecimal amount) {
		this.amount = amount;
	}

	public BigDecimal getTaxAmount() {
		return taxAmount;
	}

	public void setTaxAmount(BigDecimal taxAmount) {
		this.taxAmount = taxAmount;
	}

	public BigDecimal getTotalAmount() {
		return totalAmount;
	}

	public void setTotalAmount(BigDecimal totalAmount) {
		this.totalAmount = totalAmount;
	}

	public String getCartItemIds() {
		return cartItemIds;
	}

	public void setCartItemIds(String cartItemIds) {
		this.cartItemIds = cartItemIds;
	}

	public PaymentStatus getStatus() {
		return status;
	}

	public void setStatus(PaymentStatus status) {
		this.status = status;
	}

	public PaymentProvider getProvider() {
		return provider;
	}

	public void setProvider(PaymentProvider provider) {
		this.provider = provider;
	}

	public String getPidx() {
		return pidx;
	}

	public void setPidx(String pidx) {
		this.pidx = pidx;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(Instant createdAt) {
		this.createdAt = createdAt;
	}

	public Instant getCompletedAt() {
		return completedAt;
	}

	public void setCompletedAt(Instant completedAt) {
		this.completedAt = completedAt;
	}
}
