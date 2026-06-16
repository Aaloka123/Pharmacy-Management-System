package com.mednexus.mednexus.product;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.mednexus.mednexus.vendor.VendorStatus;
import com.mednexus.mednexus.vendor.StoreStatus;

public interface ProductRepository extends JpaRepository<Product, Long> {

	List<Product> findByVendorIdOrderByCreatedAtDesc(Long vendorId);

	boolean existsByVendorIdAndSkuIgnoreCase(Long vendorId, String sku);

	boolean existsByVendorIdAndSkuIgnoreCaseAndIdNot(Long vendorId, String sku, Long id);

	Optional<Product> findByIdAndVendorId(Long id, Long vendorId);

	@Query("""
			SELECT p FROM Product p
			JOIN FETCH p.vendor v
			WHERE v.status = :vendorStatus
			AND v.storeStatus = :storeStatus
			AND p.status = :productStatus
			AND (:category IS NULL OR LOWER(p.category) = LOWER(:category))
			ORDER BY p.createdAt DESC
			""")
	List<Product> findCatalog(
			@Param("vendorStatus") VendorStatus vendorStatus,
			@Param("storeStatus") StoreStatus storeStatus,
			@Param("productStatus") ProductStatus productStatus,
			@Param("category") String category);

	@Query("""
			SELECT p FROM Product p
			JOIN FETCH p.vendor v
			WHERE v.id = :vendorId
			AND v.status = :vendorStatus
			AND v.storeStatus = :storeStatus
			AND p.status = :productStatus
			ORDER BY p.createdAt DESC
			""")
	List<Product> findCatalogByVendorId(
			@Param("vendorId") Long vendorId,
			@Param("vendorStatus") VendorStatus vendorStatus,
			@Param("storeStatus") StoreStatus storeStatus,
			@Param("productStatus") ProductStatus productStatus);

	@Query("""
			SELECT p FROM Product p
			JOIN FETCH p.vendor v
			WHERE p.id = :id
			AND v.status = :vendorStatus
			AND v.storeStatus = :storeStatus
			AND p.status = :productStatus
			""")
	Optional<Product> findCatalogById(
			@Param("id") Long id,
			@Param("vendorStatus") VendorStatus vendorStatus,
			@Param("storeStatus") StoreStatus storeStatus,
			@Param("productStatus") ProductStatus productStatus);
}
