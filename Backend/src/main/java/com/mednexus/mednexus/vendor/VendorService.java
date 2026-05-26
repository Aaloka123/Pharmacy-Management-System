package com.mednexus.mednexus.vendor;

import java.time.Instant;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.mednexus.mednexus.vendor.dto.UpdateVendorProfileRequest;
import com.mednexus.mednexus.auth.RefreshTokenService;
import com.mednexus.mednexus.vendor.dto.VendorChangePasswordRequest;
import com.mednexus.mednexus.vendor.dto.VendorLoginRequest;
import com.mednexus.mednexus.vendor.dto.VendorResponse;

@Service
public class VendorService {

	private final VendorRepository vendorRepository;
	private final PasswordEncoder passwordEncoder;
	private final VendorFileStorage fileStorage;
	private final RefreshTokenService refreshTokenService;

	@Autowired
	public VendorService(VendorRepository vendorRepository,
			PasswordEncoder passwordEncoder,
			VendorFileStorage fileStorage,
			RefreshTokenService refreshTokenService) {
		this.vendorRepository = vendorRepository;
		this.passwordEncoder = passwordEncoder;
		this.fileStorage = fileStorage;
		this.refreshTokenService = refreshTokenService;
	}

	@Transactional
	public VendorResponse register(String name,
			String email,
			String phoneNumber,
			String location,
			String businessPanVatId,
			String businessName,
			String businessLocation,
			String pharmacyLicense,
			String password,
			MultipartFile pharmacyManagementCertificate,
			MultipartFile panVatCertificate) {

		String trimmedEmail = requireNonBlank(email, "Email is required").trim();
		String trimmedPan = requireNonBlank(businessPanVatId, "Business PAN / VAT ID is required").trim();

		if (vendorRepository.existsByEmailIgnoreCase(trimmedEmail)) {
			throw new DuplicateVendorException("A vendor with this email is already registered");
		}
		if (vendorRepository.existsByBusinessPanVatId(trimmedPan)) {
			throw new DuplicateVendorException("A vendor with this Business PAN / VAT ID is already registered");
		}

		String pharmacyCertUrl = fileStorage.store(pharmacyManagementCertificate, "pharmacy-cert");
		String panCertUrl = fileStorage.store(panVatCertificate, "pan-cert");

		Vendor vendor = new Vendor();
		vendor.setName(requireNonBlank(name, "Name is required").trim());
		vendor.setEmail(trimmedEmail);
		vendor.setPhoneNumber(requireNonBlank(phoneNumber, "Phone Number is required").trim());
		vendor.setLocation(requireNonBlank(location, "Location is required").trim());
		vendor.setBusinessPanVatId(trimmedPan);
		vendor.setBusinessName(requireNonBlank(businessName, "Business Name is required").trim());
		vendor.setBusinessLocation(requireNonBlank(businessLocation, "Business Location is required").trim());
		vendor.setPharmacyLicense(requireNonBlank(pharmacyLicense, "Pharmacy License is required").trim());
		vendor.setPassword(passwordEncoder.encode(requireNonBlank(password, "Password is required")));
		vendor.setPharmacyManagementCertificate(pharmacyCertUrl);
		vendor.setPanVatCertificate(panCertUrl);
		vendor.setStatus(VendorStatus.PENDING);
		vendor.setCreatedAt(Instant.now());

		Vendor saved = vendorRepository.save(vendor);
		return toResponse(saved);
	}

	@Transactional
	public VendorResponse login(VendorLoginRequest request) {
		if (request == null || request.email() == null || request.password() == null) {
			throw new InvalidVendorCredentialsException();
		}
		Vendor vendor = vendorRepository.findByEmailIgnoreCase(request.email().trim())
				.orElseThrow(InvalidVendorCredentialsException::new);
		if (!passwordEncoder.matches(request.password(), vendor.getPassword())) {
			throw new InvalidVendorCredentialsException();
		}
		switch (vendor.getStatus()) {
			case PENDING -> throw new VendorNotApprovedException(
					"Your vendor account is awaiting admin approval.");
			case REJECTED -> throw new InvalidVendorCredentialsException();
			case APPROVED -> { /* allowed */ }
		}
		if (passwordEncoder.upgradeEncoding(vendor.getPassword())) {
			vendor.setPassword(passwordEncoder.encode(request.password()));
		}
		return toResponse(vendor);
	}

	@Transactional(readOnly = true)
	public VendorResponse getById(Long id) {
		Vendor vendor = vendorRepository.findById(id).orElseThrow(VendorNotFoundException::new);
		return toResponse(vendor);
	}

	@Transactional(readOnly = true)
	public List<VendorResponse> list(VendorStatus status) {
		List<Vendor> vendors = status == null
				? vendorRepository.findAllByOrderByCreatedAtDesc()
				: vendorRepository.findAllByStatusOrderByCreatedAtDesc(status);
		return vendors.stream().map(this::toResponse).toList();
	}

	@Transactional
	public VendorResponse updateProfile(Long id, UpdateVendorProfileRequest request) {
		Vendor vendor = vendorRepository.findById(id).orElseThrow(VendorNotFoundException::new);
		if (request.name() != null && !request.name().isBlank()) {
			vendor.setName(request.name().trim());
		}
		if (request.phoneNumber() != null && !request.phoneNumber().isBlank()) {
			vendor.setPhoneNumber(request.phoneNumber().trim());
		}
		if (request.location() != null && !request.location().isBlank()) {
			vendor.setLocation(request.location().trim());
		}
		if (request.businessName() != null && !request.businessName().isBlank()) {
			vendor.setBusinessName(request.businessName().trim());
		}
		if (request.businessLocation() != null && !request.businessLocation().isBlank()) {
			vendor.setBusinessLocation(request.businessLocation().trim());
		}
		if (request.pharmacyLicense() != null && !request.pharmacyLicense().isBlank()) {
			vendor.setPharmacyLicense(request.pharmacyLicense().trim());
		}
		return toResponse(vendor);
	}

	@Transactional
	public VendorResponse updateProfileImage(Long id, MultipartFile image) {
		Vendor vendor = vendorRepository.findById(id).orElseThrow(VendorNotFoundException::new);
		String url = fileStorage.storeProfileImage(image, id);
		vendor.setProfileImage(url);
		return toResponse(vendor);
	}

	@Transactional
	public void changePassword(Long id, VendorChangePasswordRequest request) {
		if (request == null || request.currentPassword() == null || request.newPassword() == null) {
			throw new InvalidVendorCredentialsException();
		}
		if (request.newPassword().length() < 6) {
			throw new InvalidVendorStateException("New password must be at least 6 characters");
		}
		Vendor vendor = vendorRepository.findById(id).orElseThrow(VendorNotFoundException::new);
		if (!passwordEncoder.matches(request.currentPassword(), vendor.getPassword())) {
			throw new InvalidVendorCredentialsException();
		}
		vendor.setPassword(passwordEncoder.encode(request.newPassword()));
		refreshTokenService.revokeAllForVendor(id);
	}

	@Transactional
	public VendorResponse approve(Long id) {
		Vendor vendor = vendorRepository.findById(id).orElseThrow(VendorNotFoundException::new);
		if (vendor.getStatus() != VendorStatus.PENDING) {
			throw new InvalidVendorStateException("Vendor is not pending approval");
		}
		vendor.setStatus(VendorStatus.APPROVED);
		vendor.setDecidedAt(Instant.now());
		return toResponse(vendor);
	}

	@Transactional
	public void reject(Long id) {
		Vendor vendor = vendorRepository.findById(id).orElseThrow(VendorNotFoundException::new);
		if (vendor.getStatus() != VendorStatus.PENDING) {
			throw new InvalidVendorStateException("Vendor is not pending approval");
		}
		fileStorage.deleteByPublicUrl(vendor.getPharmacyManagementCertificate());
		fileStorage.deleteByPublicUrl(vendor.getPanVatCertificate());
		fileStorage.deleteByPublicUrl(vendor.getProfileImage());
		vendorRepository.delete(vendor);
	}

	private static String requireNonBlank(String value, String message) {
		if (value == null || value.isBlank()) {
			throw new InvalidVendorStateException(message);
		}
		return value;
	}

	private VendorResponse toResponse(Vendor vendor) {
		return new VendorResponse(
				vendor.getId(),
				vendor.getName(),
				vendor.getEmail(),
				vendor.getPhoneNumber(),
				vendor.getLocation(),
				vendor.getBusinessPanVatId(),
				vendor.getBusinessName(),
				vendor.getBusinessLocation(),
				vendor.getPharmacyLicense(),
				vendor.getPharmacyManagementCertificate(),
				vendor.getPanVatCertificate(),
				vendor.getProfileImage(),
				vendor.getStatus(),
				vendor.getCreatedAt(),
				vendor.getDecidedAt());
	}
}
