package com.mednexus.mednexus.cart;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CartRepository extends JpaRepository<Cart, Long> {

	@Query("""
			SELECT c FROM Cart c
			JOIN FETCH c.product p
			JOIN FETCH p.vendor
			WHERE c.user.id = :userId
			ORDER BY c.createdAt DESC
			""")
	List<Cart> findByUserIdWithProduct(@Param("userId") Long userId);

	Optional<Cart> findByUserIdAndProductId(Long userId, Long productId);

	Optional<Cart> findByIdAndUserId(Long id, Long userId);

	void deleteByUserIdAndIdIn(Long userId, Collection<Long> ids);

	void deleteByProductId(Long productId);
}
