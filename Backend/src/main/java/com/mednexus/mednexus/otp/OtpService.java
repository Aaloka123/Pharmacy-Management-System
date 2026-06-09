package com.mednexus.mednexus.otp;

import java.security.SecureRandom;
import java.time.Instant;
import java.util.UUID;
import java.util.concurrent.Executor;
import java.util.function.BiConsumer;
import java.util.function.Function;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mednexus.mednexus.auth.dto.PendingOtpResponse;
import com.mednexus.mednexus.user.User;
import com.mednexus.mednexus.user.UserRepository;
import com.mednexus.mednexus.vendor.Vendor;
import com.mednexus.mednexus.vendor.VendorRepository;

@Service
public class OtpService {

	private static final int OTP_TTL_MINUTES = 10;
	private static final SecureRandom RANDOM = new SecureRandom();

	private final OtpRepository otpRepository;
	private final UserRepository userRepository;
	private final VendorRepository vendorRepository;
	private final EmailService emailService;
	private final Executor mailExecutor;

	@Autowired
	public OtpService(
			OtpRepository otpRepository,
			UserRepository userRepository,
			VendorRepository vendorRepository,
			EmailService emailService,
			@Qualifier("mailExecutor") Executor mailExecutor) {
		this.otpRepository = otpRepository;
		this.userRepository = userRepository;
		this.vendorRepository = vendorRepository;
		this.emailService = emailService;
		this.mailExecutor = mailExecutor;
	}

	@Transactional
	public PendingOtpResponse issueLoginOtp(Long userId, String email) {
		otpRepository.deleteByUserId(userId);
		return issueOtp(
				OtpAccountType.USER,
				email,
				code -> buildUserOtp(userId, code),
				(recipient, code) -> emailService.sendLoginOtp(recipient, code));
	}

	@Transactional
	public PendingOtpResponse issueVendorLoginOtp(Long vendorId, String email) {
		otpRepository.deleteByVendorId(vendorId);
		return issueOtp(
				OtpAccountType.VENDOR,
				email,
				code -> buildVendorOtp(vendorId, code),
				(recipient, code) -> emailService.sendVendorLoginOtp(recipient, code));
	}

	@Transactional
	public User verifyAndConsumeForUser(String otpToken, String code) {
		Otp otp = verifyOtpRecord(otpToken, code);
		if (otp.getAccountType() != OtpAccountType.USER || otp.getUser() == null) {
			throw new InvalidOtpException("Verification code expired or invalid. Please log in again.");
		}
		User user = otp.getUser();
		otpRepository.delete(otp);
		return user;
	}

	@Transactional
	public Vendor verifyAndConsumeForVendor(String otpToken, String code) {
		Otp otp = verifyOtpRecord(otpToken, code);
		if (otp.getAccountType() != OtpAccountType.VENDOR || otp.getVendor() == null) {
			throw new InvalidOtpException("Verification code expired or invalid. Please log in again.");
		}
		Vendor vendor = otp.getVendor();
		otpRepository.delete(otp);
		return vendor;
	}

	private PendingOtpResponse issueOtp(
			OtpAccountType accountType,
			String email,
			Function<String, Otp> otpBuilder,
			BiConsumer<String, String> mailSender) {
		String code = String.format("%06d", RANDOM.nextInt(1_000_000));
		String otpToken = UUID.randomUUID().toString().replace("-", "");

		Otp otp = otpBuilder.apply(code);
		otp.setAccountType(accountType);
		otp.setOtpToken(otpToken);
		otp.setCode(code);
		otp.setExpiresAt(Instant.now().plusSeconds(OTP_TTL_MINUTES * 60L));
		otpRepository.save(otp);

		String recipient = email;
		mailExecutor.execute(() -> mailSender.accept(recipient, code));

		return new PendingOtpResponse(
				true,
				otpToken,
				maskEmail(email),
				"Check your email for the 6-digit verification code.");
	}

	private Otp buildUserOtp(Long userId, String code) {
		Otp otp = new Otp();
		otp.setUser(userRepository.getReferenceById(userId));
		return otp;
	}

	private Otp buildVendorOtp(Long vendorId, String code) {
		Otp otp = new Otp();
		otp.setVendor(vendorRepository.getReferenceById(vendorId));
		return otp;
	}

	private Otp verifyOtpRecord(String otpToken, String code) {
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
		return otp;
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
