package com.mednexus.mednexus.bill;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BillRepository extends JpaRepository<Bill, Long> {

	@Query("""
			SELECT DISTINCT b FROM Bill b
			LEFT JOIN FETCH b.lines
			WHERE b.vendor.id = :vendorId
			ORDER BY b.createdAt DESC
			""")
	List<Bill> findByVendorIdWithLines(@Param("vendorId") Long vendorId);

	@Query("""
			SELECT b FROM Bill b
			LEFT JOIN FETCH b.lines
			WHERE b.id = :billId AND b.vendor.id = :vendorId
			""")
	Optional<Bill> findByIdAndVendorIdWithLines(
			@Param("billId") Long billId,
			@Param("vendorId") Long vendorId);

	long countByVendorId(Long vendorId);

	boolean existsByVendorIdAndInvoiceNumber(Long vendorId, String invoiceNumber);

	boolean existsByVendorIdAndInvoiceNumberAndIdNot(Long vendorId, String invoiceNumber, Long id);
}
