package com.mednexus.mednexus.vendor;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface VendorRepository extends JpaRepository<Vendor, Long> {

	boolean existsByEmailIgnoreCase(String email);

	boolean existsByBusinessPanVatId(String businessPanVatId);

	Optional<Vendor> findByEmailIgnoreCase(String email);

	List<Vendor> findAllByStatusOrderByCreatedAtDesc(VendorStatus status);

	List<Vendor> findAllByOrderByCreatedAtDesc();
}
