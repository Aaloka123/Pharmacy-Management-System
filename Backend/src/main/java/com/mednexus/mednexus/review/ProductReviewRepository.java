package com.mednexus.mednexus.review;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Pageable;
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

	boolean existsByUser_IdAndProduct_Id(Long userId, Long productId);

	Optional<ProductReview> findByIdAndProduct_Id(Long id, Long productId);

	Optional<ProductReview> findByIdAndProduct_Vendor_Id(Long id, Long vendorId);

	@Query("""
			SELECT r FROM ProductReview r
			JOIN FETCH r.user
			JOIN FETCH r.product
			WHERE r.id = :id
			""")
	Optional<ProductReview> findByIdWithDetails(@Param("id") Long id);

	@Query("""
			SELECT r FROM ProductReview r
			JOIN FETCH r.user
			JOIN FETCH r.product p
			JOIN FETCH p.vendor
			WHERE r.id = :id AND p.vendor.id = :vendorId
			""")
	Optional<ProductReview> findByIdAndVendorIdWithDetails(
			@Param("id") Long id,
			@Param("vendorId") Long vendorId);

	@Query("""
			SELECT r FROM ProductReview r
			JOIN FETCH r.user
			JOIN FETCH r.product
			ORDER BY r.createdAt DESC
			""")
	List<ProductReview> findAllWithDetails();

	@Query("""
			SELECT r FROM ProductReview r
			JOIN FETCH r.product
			ORDER BY r.createdAt DESC
			""")
	List<ProductReview> findTop10ByOrderByCreatedAtDesc(Pageable pageable);

	@Query("""
			SELECT p.vendor.id, AVG(r.rating)
			FROM ProductReview r
			JOIN r.product p
			GROUP BY p.vendor.id
			""")
	List<Object[]> averageRatingByVendor();

	@Query("""
			SELECT AVG(r.rating), COUNT(r)
			FROM ProductReview r
			JOIN r.product p
			WHERE p.vendor.id = :vendorId
			""")
	Object[] averageRatingAndCountForVendor(@Param("vendorId") Long vendorId);
}
