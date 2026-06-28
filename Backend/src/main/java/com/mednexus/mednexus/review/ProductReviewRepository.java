package com.mednexus.mednexus.review;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ProductReviewRepository extends JpaRepository<ProductReview, Long> {

	@Query("""
			SELECT r FROM ProductReview r
			JOIN FETCH r.user
			JOIN FETCH r.product
			WHERE r.product.id = :productId
			ORDER BY r.createdAt DESC
			""")
	List<ProductReview> findByProductIdWithUser(@Param("productId") Long productId);

	@Query("""
			SELECT r FROM ProductReview r
			JOIN FETCH r.user
			JOIN FETCH r.product p
			WHERE p.vendor.id = :vendorId
			ORDER BY r.createdAt DESC
			""")
		List<ProductReview> findByVendorIdWithDetails(@Param("vendorId") Long vendorId);

	Optional<ProductReview> findByIdAndProduct_Id(Long id, Long productId);
}
