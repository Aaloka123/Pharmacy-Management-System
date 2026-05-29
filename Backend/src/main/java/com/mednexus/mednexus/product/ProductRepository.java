package com.mednexus.mednexus.product;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mednexus.mednexus.vendor.VendorStatus;

public interface ProductRepository extends JpaRepository<Product, Long> {

	List<Product> findByVendorIdOrderByCreatedAtDesc(Long vendorId);

	boolean existsByVendorIdAndSkuIgnoreCase(Long vendorId, String sku);

	boolean existsByVendorIdAndSkuIgnoreCaseAndIdNot(Long vendorId, String sku, Long id);

	Optional<Product> findByIdAndVendorId(Long id, Long vendorId);

	@Query("""
			SELECT p FROM Product p
			JOIN FETCH p.vendor v
			WHERE v.status = :vendorStatus
			AND p.status = :productStatus
			AND (:category IS NULL OR LOWER(p.category) = LOWER(:category))
			ORDER BY p.createdAt DESC
			""")
	List<Product> findCatalog(
			@Param("vendorStatus") VendorStatus vendorStatus,
			@Param("productStatus") ProductStatus productStatus,
			@Param("category") String category);

	@Query("""
			SELECT p FROM Product p
			JOIN FETCH p.vendor v
			WHERE p.id = :id
			AND v.status = :vendorStatus
			AND p.status = :productStatus
			""")
	Optional<Product> findCatalogById(
			@Param("id") Long id,
			@Param("vendorStatus") VendorStatus vendorStatus,
			@Param("productStatus") ProductStatus productStatus);
}
