package com.mednexus.mednexus.otp;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.Executor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mednexus.mednexus.auth.dto.PendingOtpResponse;
import com.mednexus.mednexus.user.User;
import com.mednexus.mednexus.user.UserRepository;

@Service
public class OtpService {

	private static final int OTP_TTL_MINUTES = 10;
	private static final SecureRandom RANDOM = new SecureRandom();

	private final OtpRepository otpRepository;
	private final UserRepository userRepository;
	private final EmailService emailService;
	private final Executor mailExecutor;

	@Autowired
	public OtpService(
			OtpRepository otpRepository,
			UserRepository userRepository,
			EmailService emailService,
			@Qualifier("mailExecutor") Executor mailExecutor) {
		this.otpRepository = otpRepository;
		this.userRepository = userRepository;
		this.emailService = emailService;
		this.mailExecutor = mailExecutor;
	}

	@Transactional
	public PendingOtpResponse issueLoginOtp(Long userId, String email) {
		otpRepository.deleteByUserId(userId);

		String code = String.format("%06d", RANDOM.nextInt(1_000_000));
		String otpToken = UUID.randomUUID().toString().replace("-", "");

		Otp otp = new Otp();
		otp.setUser(userRepository.getReferenceById(userId));
		otp.setOtpToken(otpToken);
		otp.setCode(code);
		otp.setExpiresAt(Instant.now().plusSeconds(OTP_TTL_MINUTES * 60L));
		otpRepository.save(otp);

		String recipient = email;
		mailExecutor.execute(() -> emailService.sendLoginOtp(recipient, code));

		return new PendingOtpResponse(
				true,
				otpToken,
				maskEmail(email),
				"Check your email for the 6-digit verification code.");
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
