package com.mednexus.mednexus.auth;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

	Optional<RefreshToken> findByTokenHashAndRevokedFalse(String tokenHash);

	@Modifying
	@Query("update RefreshToken r set r.revoked = true where r.user.id = :userId and r.revoked = false")
	int revokeAllActiveForUser(@Param("userId") Long userId);

	@Modifying
	@Query("update RefreshToken r set r.revoked = true where r.vendor.id = :vendorId and r.revoked = false")
	int revokeAllActiveForVendor(@Param("vendorId") Long vendorId);
}
