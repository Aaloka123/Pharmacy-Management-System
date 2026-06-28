package com.mednexus.mednexus.review;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface VendorReviewLikeRepository extends JpaRepository<VendorReviewLike, Long> {

	boolean existsByReviewIdAndVendorId(Long reviewId, Long vendorId);

	Optional<VendorReviewLike> findByReviewIdAndVendorId(Long reviewId, Long vendorId);

	long countByReviewId(Long reviewId);

	@Query("""
			SELECT vl FROM VendorReviewLike vl
			JOIN FETCH vl.vendor
			WHERE vl.review.id = :reviewId
			""")
	Optional<VendorReviewLike> findByReviewIdWithVendor(@Param("reviewId") Long reviewId);

	@Query("""
			SELECT vl FROM VendorReviewLike vl
			JOIN FETCH vl.vendor
			WHERE vl.review.id IN :reviewIds
			""")
	List<VendorReviewLike> findByReviewIdInWithVendor(@Param("reviewIds") List<Long> reviewIds);
}
