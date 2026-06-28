package com.mednexus.mednexus.vendor;

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
@Table(name = "vendor")
public class Vendor {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "name", nullable = false, length = 150)
	private String name;

	@Column(name = "email", nullable = false, unique = true, length = 150)
	private String email;

	@Column(name = "phone_number", nullable = false, length = 30)
	private String phoneNumber;

	@Column(name = "location", nullable = false, length = 255)
	private String location;

	@Column(name = "business_pan_vat_id", nullable = false, unique = true, length = 50)
	private String businessPanVatId;

	@Column(name = "business_name", nullable = false, length = 200)
	private String businessName;

	@Column(name = "business_location", nullable = false, length = 255)
	private String businessLocation;

	@Column(name = "pharmacy_license", nullable = false, length = 100)
	private String pharmacyLicense;

	@Column(name = "password", nullable = false, length = 255)
	private String password;

	@Column(name = "pharmacy_management_certificate", nullable = false, length = 2048)
	private String pharmacyManagementCertificate;

	@Column(name = "pan_vat_certificate", nullable = false, length = 2048)
	private String panVatCertificate;

	@Column(name = "profile_image", length = 2048)
	private String profileImage;

	@Enumerated(EnumType.STRING)
	@Column(name = "status", nullable = false, length = 20)
	private VendorStatus status = VendorStatus.PENDING;

	@Enumerated(EnumType.STRING)
	@Column(name = "store_status", nullable = false, length = 20)
	private StoreStatus storeStatus = StoreStatus.OPEN;

	@Column(name = "store_locked_by_admin", nullable = false)
	private boolean storeLockedByAdmin = false;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@Column(name = "decided_at")
	private Instant decidedAt;

	@Column(name = "refresh_token_hash", unique = true, length = 64)
	private String refreshTokenHash;

	@Column(name = "refresh_token_expires_at")
	private Instant refreshTokenExpiresAt;

	public Vendor() {
	}

	@PrePersist
	void onCreate() {
		if (createdAt == null) {
			createdAt = Instant.now();
		}
		if (storeStatus == null) {
			storeStatus = StoreStatus.OPEN;
		}
	}

	public Long getId() {
		return id;
	}

	public void setId(Long id) {
		this.id = id;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public String getPhoneNumber() {
		return phoneNumber;
	}

	public void setPhoneNumber(String phoneNumber) {
		this.phoneNumber = phoneNumber;
	}

	public String getLocation() {
		return location;
	}

	public void setLocation(String location) {
		this.location = location;
	}

	public String getBusinessPanVatId() {
		return businessPanVatId;
	}

	public void setBusinessPanVatId(String businessPanVatId) {
		this.businessPanVatId = businessPanVatId;
	}

	public String getBusinessName() {
		return businessName;
	}

	public void setBusinessName(String businessName) {
		this.businessName = businessName;
	}

	public String getBusinessLocation() {
		return businessLocation;
	}

	public void setBusinessLocation(String businessLocation) {
		this.businessLocation = businessLocation;
	}

	public String getPharmacyLicense() {
		return pharmacyLicense;
	}

	public void setPharmacyLicense(String pharmacyLicense) {
		this.pharmacyLicense = pharmacyLicense;
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
	}

	public String getPharmacyManagementCertificate() {
		return pharmacyManagementCertificate;
	}

	public void setPharmacyManagementCertificate(String pharmacyManagementCertificate) {
		this.pharmacyManagementCertificate = pharmacyManagementCertificate;
	}

	public String getPanVatCertificate() {
		return panVatCertificate;
	}

	public void setPanVatCertificate(String panVatCertificate) {
		this.panVatCertificate = panVatCertificate;
	}

	public String getProfileImage() {
		return profileImage;
	}

	public void setProfileImage(String profileImage) {
		this.profileImage = profileImage;
	}

	public VendorStatus getStatus() {
		return status;
	}

	public void setStatus(VendorStatus status) {
		this.status = status;
	}

	public StoreStatus getStoreStatus() {
		return storeStatus;
	}

	public void setStoreStatus(StoreStatus storeStatus) {
		this.storeStatus = storeStatus;
	}

	public boolean isStoreLockedByAdmin() {
		return storeLockedByAdmin;
	}

	public void setStoreLockedByAdmin(boolean storeLockedByAdmin) {
		this.storeLockedByAdmin = storeLockedByAdmin;
	}

	public Instant getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(Instant createdAt) {
		this.createdAt = createdAt;
	}

	public Instant getDecidedAt() {
		return decidedAt;
	}

	public void setDecidedAt(Instant decidedAt) {
		this.decidedAt = decidedAt;
	}

	public String getRefreshTokenHash() {
		return refreshTokenHash;
	}

	public void setRefreshTokenHash(String refreshTokenHash) {
		this.refreshTokenHash = refreshTokenHash;
	}

	public Instant getRefreshTokenExpiresAt() {
		return refreshTokenExpiresAt;
	}

	public void setRefreshTokenExpiresAt(Instant refreshTokenExpiresAt) {
		this.refreshTokenExpiresAt = refreshTokenExpiresAt;
	}
}
