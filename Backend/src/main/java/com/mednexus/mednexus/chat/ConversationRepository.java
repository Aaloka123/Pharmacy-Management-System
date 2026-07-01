package com.mednexus.mednexus.chat;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {

	Optional<Conversation> findByUserIdAndVendorId(Long userId, Long vendorId);

	@Query("""
			SELECT c FROM Conversation c
			JOIN FETCH c.user
			JOIN FETCH c.vendor
			WHERE c.user.id = :userId
			""")
	List<Conversation> findByUserIdWithDetails(@Param("userId") Long userId);

	@Query("""
			SELECT c FROM Conversation c
			JOIN FETCH c.user
			JOIN FETCH c.vendor
			WHERE c.vendor.id = :vendorId
			""")
	List<Conversation> findByVendorIdWithDetails(@Param("vendorId") Long vendorId);

	@Query("""
			SELECT c FROM Conversation c
			JOIN FETCH c.user
			JOIN FETCH c.vendor
			WHERE c.id = :id
			""")
	Optional<Conversation> findByIdWithDetails(@Param("id") Long id);
}
