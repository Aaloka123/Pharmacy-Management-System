package com.mednexus.mednexus.otp;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface OtpRepository extends JpaRepository<Otp, Long> {

	Optional<Otp> findByOtpToken(String otpToken);

	@Modifying
	@Query("DELETE FROM Otp o WHERE o.user.id = :userId")
	void deleteByUserId(@Param("userId") Long userId);

	@Modifying
	@Query("DELETE FROM Otp o WHERE o.vendor.id = :vendorId")
	void deleteByVendorId(@Param("vendorId") Long vendorId);
}
