package com.mednexus.mednexus.otp;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

	private static final Logger log = LoggerFactory.getLogger(EmailService.class);
	private static final int OTP_TTL_MINUTES = 10;

	private final JavaMailSender mailSender;
	private final String fromAddress;
	private final String frontendBaseUrl;

	@Autowired
	public EmailService(
			JavaMailSender mailSender,
			@Value("${mednexus.mail.from:${spring.mail.username}}") String fromAddress,
			@Value("${mednexus.mail.frontend-base-url:${mednexus.esewa.frontend-base-url:http://localhost:5173}}") String frontendBaseUrl) {
		this.mailSender = mailSender;
		this.fromAddress = fromAddress;
		this.frontendBaseUrl = frontendBaseUrl.replaceAll("/$", "");
	}

	public void sendLoginOtp(String toEmail, String code) {
		sendOtpEmail(
				toEmail,
				code,
				"Your MedNexus login verification code",
				"Verify your login",
				"Use the verification code below to sign in to your MedNexus account.");
	}

	public void sendVendorLoginOtp(String toEmail, String code) {
		sendOtpEmail(
				toEmail,
				code,
				"Your MedNexus vendor login verification code",
				"Verify your vendor login",
				"Use the verification code below to sign in to the MedNexus vendor portal.");
	}

	public void sendPasswordResetOtp(String toEmail, String code) {
		sendOtpEmail(
				toEmail,
				code,
				"Your MedNexus password reset code",
				"Reset your password",
				"Use the verification code below to reset your MedNexus account password.");
	}

	public void sendVendorPasswordResetOtp(String toEmail, String code) {
		sendOtpEmail(
				toEmail,
				code,
				"Your MedNexus vendor password reset code",
				"Reset your vendor password",
				"Use the verification code below to reset your MedNexus vendor portal password.");
	}

	private void sendOtpEmail(String toEmail, String code, String subject, String headline, String intro) {
		String html = EmailHtmlBuilder.otpVerification(headline, intro, code, OTP_TTL_MINUTES);
		String plainText = """
				%s

				Your verification code is: %s

				This code expires in %d minutes. Do not share it with anyone.

				— The MedNexus Team
				""".formatted(intro, code, OTP_TTL_MINUTES);
		sendHtmlEmail(toEmail, subject, html, plainText);
	}

	public void sendWelcomeEmail(String toEmail, String fullName) {
		String greetingName = fullName == null || fullName.isBlank() ? "there" : fullName.trim();
		String html = EmailHtmlBuilder.welcomeUser(greetingName, frontendBaseUrl);
		String plainText = """
				Hello %s,

				Welcome to MedNexus!

				Your account has been created successfully. You can now browse medicines, explore partner pharmacies, and manage your orders with confidence.

				Visit us: %s

				— The MedNexus Team
				""".formatted(greetingName, frontendBaseUrl);
		sendHtmlEmail(toEmail, "Welcome to MedNexus", html, plainText);
	}

	public void sendVendorPendingApprovalEmail(String toEmail, String vendorName, String businessName) {
		String greetingName = vendorName == null || vendorName.isBlank() ? "there" : vendorName.trim();
		String business = businessName == null || businessName.isBlank() ? "your pharmacy" : businessName.trim();
		String html = EmailHtmlBuilder.vendorPendingApproval(greetingName, business);
		String plainText = """
				Hello %s,

				Thank you for applying to join MedNexus as a partner pharmacy.

				We have received your application for %s. Your request is currently pending admin review.

				Our team will verify your documents and business details. You will receive another email once your account is approved.

				— The MedNexus Team
				""".formatted(greetingName, business);
		sendHtmlEmail(toEmail, "Your MedNexus vendor application is under review", html, plainText);
	}

	public void sendVendorApprovedWelcomeEmail(String toEmail, String vendorName, String businessName) {
		String greetingName = vendorName == null || vendorName.isBlank() ? "there" : vendorName.trim();
		String business = businessName == null || businessName.isBlank() ? "your pharmacy" : businessName.trim();
		String html = EmailHtmlBuilder.vendorApprovedWelcome(greetingName, business, frontendBaseUrl);
		String plainText = """
				Hello %s,

				Great news — your vendor application for %s has been approved!

				Welcome to the MedNexus vendor portal. You can now log in to manage products, track orders, and grow your online presence with us.

				Vendor login: %s/vendorlogin

				— The MedNexus Team
				""".formatted(greetingName, business, frontendBaseUrl);
		sendHtmlEmail(toEmail, "Welcome to the MedNexus vendor portal", html, plainText);
	}

	private void sendHtmlEmail(String toEmail, String subject, String html, String plainText) {
		try {
			MimeMessage message = mailSender.createMimeMessage();
			MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
			helper.setFrom(fromAddress, "MedNexus");
			helper.setTo(toEmail);
			helper.setSubject(subject);
			helper.setText(plainText, html);
			mailSender.send(message);
		} catch (Exception ex) {
			log.error("Failed to send email to {}", toEmail, ex);
		}
	}
}
