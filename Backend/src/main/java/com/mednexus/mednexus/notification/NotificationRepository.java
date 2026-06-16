package com.mednexus.mednexus.notification;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationRepository extends JpaRepository<Notification, Long> {

	@Query("""
			SELECT n FROM Notification n
			WHERE n.user.id = :userId
			ORDER BY n.createdAt DESC
			""")
	List<Notification> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId);

	long countByUserIdAndReadFalse(Long userId);

	@Modifying
	@Query("UPDATE Notification n SET n.read = true WHERE n.id = :id AND n.user.id = :userId")
	int markRead(@Param("id") Long id, @Param("userId") Long userId);

	@Modifying
	@Query("UPDATE Notification n SET n.read = true WHERE n.user.id = :userId AND n.read = false")
	int markAllRead(@Param("userId") Long userId);
}
