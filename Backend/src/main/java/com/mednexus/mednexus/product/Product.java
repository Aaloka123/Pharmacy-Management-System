package com.mednexus.mednexus.product;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import com.mednexus.mednexus.vendor.Vendor;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
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
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
		name = "product",
		uniqueConstraints = @UniqueConstraint(name = "uk_product_vendor_sku", columnNames = { "vendor_id", "sku" }))
public class Product {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "vendor_id", nullable = false)
	private Vendor vendor;

	@Column(name = "product_name", nullable = false, length = 200)
	private String productName;

	@Column(name = "sku", nullable = false, length = 80)
	private String sku;

	@Column(name = "category", nullable = false, length = 100)
	private String category;

	@Column(name = "strength", nullable = false, length = 50)
	private String strength;

	@Column(name = "form", nullable = false, length = 50)
	private String form;

	@Column(name = "quantity", nullable = false, length = 50)
	private String quantity;

	@Column(name = "storage_requirements", nullable = false, length = 500)
	private String storageRequirements;

	@Column(name = "expiry_date", nullable = false)
	private LocalDate expiryDate;

	@JdbcTypeCode(SqlTypes.LONG32VARCHAR)
	@Column(name = "product_description", nullable = false)
	private String productDescription;

	@JdbcTypeCode(SqlTypes.LONG32VARCHAR)
	@Convert(converter = StringListJsonConverter.class)
	@Column(name = "dosage_instructions", nullable = false)
	private List<String> dosageInstructions = new ArrayList<>();

	@JdbcTypeCode(SqlTypes.LONG32VARCHAR)
	@Convert(converter = StringListJsonConverter.class)
	@Column(name = "side_effects", nullable = false)
	private List<String> sideEffects = new ArrayList<>();

	@Column(name = "price", nullable = false, precision = 12, scale = 2)
	private BigDecimal price;

	@Column(name = "stock", nullable = false)
	private int stock;

	@Enumerated(EnumType.STRING)
	@Column(name = "status", nullable = false, length = 20)
	private ProductStatus status = ProductStatus.ACTIVE;

	@JdbcTypeCode(SqlTypes.LONG32VARCHAR)
	@Convert(converter = StringListJsonConverter.class)
	@Column(name = "images", nullable = false)
	private List<String> images = new ArrayList<>();

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	public Product() {
	}

	@PrePersist
	void onCreate() {
		Instant now = Instant.now();
		if (createdAt == null) {
			createdAt = now;
		}
		updatedAt = now;
	}

	@PreUpdate
	void onUpdate() {
		updatedAt = Instant.now();
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public Vendor getVendor() {
		return vendor;
	}

	public void setVendor(Vendor vendor) {
		this.vendor = vendor;
	}

	public String getProductName() {
		return productName;
	}

	public void setProductName(String productName) {
		this.productName = productName;
	}

	public String getSku() {
		return sku;
	}

	public void setSku(String sku) {
		this.sku = sku;
	}

	public String getCategory() {
		return category;
	}

	public void setCategory(String category) {
		this.category = category;
	}

	public String getStrength() {
		return strength;
	}

	public void setStrength(String strength) {
		this.strength = strength;
	}

	public String getForm() {
		return form;
	}

	public void setForm(String form) {
		this.form = form;
	}

	public String getQuantity() {
		return quantity;
	}

	public void setQuantity(String quantity) {
		this.quantity = quantity;
	}

	public String getStorageRequirements() {
		return storageRequirements;
	}

	public void setStorageRequirements(String storageRequirements) {
		this.storageRequirements = storageRequirements;
	}

	public LocalDate getExpiryDate() {
		return expiryDate;
	}

	public void setExpiryDate(LocalDate expiryDate) {
		this.expiryDate = expiryDate;
	}

	public String getProductDescription() {
		return productDescription;
	}

	public void setProductDescription(String productDescription) {
		this.productDescription = productDescription;
	}

	public List<String> getDosageInstructions() {
		return dosageInstructions;
	}

	public void setDosageInstructions(List<String> dosageInstructions) {
		this.dosageInstructions = dosageInstructions != null ? dosageInstructions : new ArrayList<>();
	}

	public List<String> getSideEffects() {
		return sideEffects;
	}

	public void setSideEffects(List<String> sideEffects) {
		this.sideEffects = sideEffects != null ? sideEffects : new ArrayList<>();
	}

	public BigDecimal getPrice() {
		return price;
	}

	public void setPrice(BigDecimal price) {
		this.price = price;
	}

	public int getStock() {
		return stock;
	}

	public void setStock(int stock) {
		this.stock = stock;
	}

	public ProductStatus getStatus() {
		return status;
	}

	public void setStatus(ProductStatus status) {
		this.status = status;
	}

	public List<String> getImages() {
		return images;
	}

	public void setImages(List<String> images) {
		this.images = images != null ? images : new ArrayList<>();
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(Instant createdAt) {
		this.createdAt = createdAt;
	}

	public Instant getUpdatedAt() {
		return updatedAt;
	}

	public void setUpdatedAt(Instant updatedAt) {
		this.updatedAt = updatedAt;
	}
}
