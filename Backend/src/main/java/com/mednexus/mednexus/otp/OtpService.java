package com.mednexus.mednexus.otp;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mednexus.mednexus.auth.dto.PendingOtpResponse;
import com.mednexus.mednexus.user.User;

@Service
public class OtpService {

	private static final int OTP_TTL_MINUTES = 10;
	private static final SecureRandom RANDOM = new SecureRandom();

	private final OtpRepository otpRepository;
	private final EmailService emailService;

	@Autowired
	public OtpService(OtpRepository otpRepository, EmailService emailService) {
		this.otpRepository = otpRepository;
		this.emailService = emailService;
	}

	@Transactional
	public PendingOtpResponse issueLoginOtp(User user) {
		otpRepository.deleteByUserId(user.getId());

		String code = String.format("%06d", RANDOM.nextInt(1_000_000));
		String otpToken = UUID.randomUUID().toString().replace("-", "");

		Otp otp = new Otp();
		otp.setUser(user);
		otp.setOtpToken(otpToken);
		otp.setCode(code);
		otp.setExpiresAt(Instant.now().plusSeconds(OTP_TTL_MINUTES * 60L));
		otpRepository.save(otp);

		emailService.sendLoginOtp(user.getEmail(), code);

		return new PendingOtpResponse(
				true,
				otpToken,
				maskEmail(user.getEmail()),
				"A 6-digit verification code was sent to your email.");
	}

	@Transactional
	public User verifyAndConsume(String otpToken, String code) {
		if (otpToken == null || otpToken.isBlank()) {
			throw new InvalidOtpException("Verification session is invalid.");
		}
		String normalizedCode = code == null ? "" : code.trim();
		if (!normalizedCode.matches("\\d{6}")) {
			throw new InvalidOtpException("Enter the 6-digit verification code.");
		}

		Otp otp = otpRepository.findByOtpToken(otpToken.trim())
				.orElseThrow(() -> new InvalidOtpException("Verification code expired or invalid. Please log in again."));

		if (otp.getExpiresAt().isBefore(Instant.now())) {
			otpRepository.delete(otp);
			throw new InvalidOtpException("Verification code has expired. Please log in again.");
		}

		if (!otp.getCode().equals(normalizedCode)) {
			throw new InvalidOtpException("Incorrect verification code.");
		}

		User user = otp.getUser();
		otpRepository.delete(otp);
		return user;
	}

	static String maskEmail(String email) {
		if (email == null || !email.contains("@")) {
			return "your email";
		}
		int at = email.indexOf('@');
		String local = email.substring(0, at);
		String domain = email.substring(at);
		if (local.length() <= 1) {
			return "*" + domain;
		}
		return local.charAt(0) + "***" + domain;
	}
}
