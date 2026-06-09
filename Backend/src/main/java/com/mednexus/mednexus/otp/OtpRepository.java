package com.mednexus.mednexus.otp;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface OtpRepository extends JpaRepository<Otp, Long> {

	Optional<Otp> findByOtpToken(String otpToken);

	void deleteByUserId(Long userId);
}
