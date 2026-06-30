package com.mednexus.mednexus.review;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface AdminReviewLikeRepository extends JpaRepository<AdminReviewLike, Long> {

	boolean existsByReviewIdAndAdminUser_Id(Long reviewId, Long adminUserId);

	Optional<AdminReviewLike> findByReviewIdAndAdminUser_Id(Long reviewId, Long adminUserId);

	long countByReviewId(Long reviewId);
}
