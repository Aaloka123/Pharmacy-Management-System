package com.mednexus.mednexus.vendor;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface VendorRepository extends JpaRepository<Vendor, Long> {

	boolean existsByEmailIgnoreCase(String email);

	boolean existsByBusinessPanVatId(String businessPanVatId);

	List<Vendor> findAllByStatusOrderByCreatedAtDesc(VendorStatus status);

	List<Vendor> findAllByOrderByCreatedAtDesc();
}
