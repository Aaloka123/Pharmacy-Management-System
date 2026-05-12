package com.mednexus.mednexus.vendor;

import java.time.Instant;
import java.util.List;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.mednexus.mednexus.vendor.dto.VendorResponse;

@Service
public class VendorService {

	private final VendorRepository vendorRepository;
	private final PasswordEncoder passwordEncoder;
	private final VendorFileStorage fileStorage;

	public VendorService(VendorRepository vendorRepository,
			PasswordEncoder passwordEncoder,
			VendorFileStorage fileStorage) {
		this.vendorRepository = vendorRepository;
		this.passwordEncoder = passwordEncoder;
		this.fileStorage = fileStorage;
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

	@Transactional(readOnly = true)
	public List<VendorResponse> list(VendorStatus status) {
		List<Vendor> vendors = status == null
				? vendorRepository.findAllByOrderByCreatedAtDesc()
				: vendorRepository.findAllByStatusOrderByCreatedAtDesc(status);
		return vendors.stream().map(this::toResponse).toList();
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
	public VendorResponse reject(Long id) {
		Vendor vendor = vendorRepository.findById(id).orElseThrow(VendorNotFoundException::new);
		if (vendor.getStatus() != VendorStatus.PENDING) {
			throw new InvalidVendorStateException("Vendor is not pending approval");
		}
		vendor.setStatus(VendorStatus.REJECTED);
		vendor.setDecidedAt(Instant.now());
		return toResponse(vendor);
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
				vendor.getStatus(),
				vendor.getCreatedAt(),
				vendor.getDecidedAt());
	}
}
