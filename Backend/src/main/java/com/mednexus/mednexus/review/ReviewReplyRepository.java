package com.mednexus.mednexus.review;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ReviewReplyRepository extends JpaRepository<ReviewReply, Long> {

	Optional<ReviewReply> findByReviewId(Long reviewId);

	@Query("""
			SELECT rr FROM ReviewReply rr
			JOIN FETCH rr.vendor
			WHERE rr.review.id = :reviewId
			""")
	Optional<ReviewReply> findByReviewIdWithVendor(@Param("reviewId") Long reviewId);

	@Query("""
			SELECT rr FROM ReviewReply rr
			JOIN FETCH rr.vendor
			WHERE rr.review.id IN :reviewIds
			""")
	List<ReviewReply> findByReviewIdInWithVendor(@Param("reviewIds") List<Long> reviewIds);
}
