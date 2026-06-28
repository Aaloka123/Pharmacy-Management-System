package com.mednexus.mednexus.review;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ReviewLikeRepository extends JpaRepository<ReviewLike, Long> {

	boolean existsByReviewIdAndUserId(Long reviewId, Long userId);

	Optional<ReviewLike> findByReviewIdAndUserId(Long reviewId, Long userId);

	long countByReviewId(Long reviewId);

	void deleteByReviewIdAndUserId(Long reviewId, Long userId);
}
