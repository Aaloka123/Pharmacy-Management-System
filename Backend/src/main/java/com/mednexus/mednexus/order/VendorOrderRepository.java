package com.mednexus.mednexus.order;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface VendorOrderRepository extends JpaRepository<VendorOrder, Long> {

	@Query("""
			SELECT o FROM VendorOrder o
			JOIN FETCH o.user
			JOIN FETCH o.product
			WHERE o.vendor.id = :vendorId
			ORDER BY o.createdAt DESC
			""")
	List<VendorOrder> findByVendorIdWithDetails(@Param("vendorId") Long vendorId);

	@Query("""
			SELECT o FROM VendorOrder o
			JOIN FETCH o.vendor
			JOIN FETCH o.product
			WHERE o.user.id = :userId
			ORDER BY o.createdAt DESC
			""")
	List<VendorOrder> findByUserIdWithDetails(@Param("userId") Long userId);

	Optional<VendorOrder> findByIdAndVendorId(Long id, Long vendorId);

	@Query("""
			SELECT o FROM VendorOrder o
			JOIN FETCH o.user
			JOIN FETCH o.vendor
			JOIN FETCH o.product
			WHERE o.id = :orderId AND o.vendor.id = :vendorId
			""")
	Optional<VendorOrder> findByIdAndVendorIdWithDetails(
			@Param("orderId") Long orderId,
			@Param("vendorId") Long vendorId);

	@Query("""
			SELECT o FROM VendorOrder o
			JOIN FETCH o.user
			JOIN FETCH o.product
			WHERE o.id = :orderId AND o.user.id = :userId
			""")
	Optional<VendorOrder> findByIdAndUserIdWithDetails(
			@Param("orderId") Long orderId,
			@Param("userId") Long userId);
}
