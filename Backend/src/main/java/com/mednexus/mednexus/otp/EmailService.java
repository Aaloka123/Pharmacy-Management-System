package com.mednexus.mednexus.otp;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

	private static final Logger log = LoggerFactory.getLogger(EmailService.class);

	private final JavaMailSender mailSender;
	private final String fromAddress;

	@Autowired
	public EmailService(
			JavaMailSender mailSender,
			@Value("${mednexus.mail.from:${spring.mail.username}}") String fromAddress) {
		this.mailSender = mailSender;
		this.fromAddress = fromAddress;
	}

	public void sendLoginOtp(String toEmail, String code) {
		sendOtpEmail(toEmail, code, "Your MedNexus login verification code", "Your MedNexus verification code is: %s");
	}

	public void sendVendorLoginOtp(String toEmail, String code) {
		sendOtpEmail(toEmail, code, "Your MedNexus vendor login verification code",
				"Your MedNexus vendor portal verification code is: %s");
	}

	public void sendPasswordResetOtp(String toEmail, String code) {
		sendOtpEmail(toEmail, code, "Your MedNexus password reset code",
				"Your MedNexus password reset code is: %s");
	}

	private void sendOtpEmail(String toEmail, String code, String subject, String bodyTemplate) {
		try {
			SimpleMailMessage message = new SimpleMailMessage();
			message.setFrom(fromAddress);
			message.setTo(toEmail);
			message.setSubject(subject);
			message.setText("%s\n\nExpires in 10 minutes.".formatted(bodyTemplate.formatted(code)));
			mailSender.send(message);
		} catch (Exception ex) {
			log.error("Failed to send OTP email to {}", toEmail, ex);
		}
	}

	public void sendWelcomeEmail(String toEmail, String fullName) {
		try {
			String greetingName = fullName == null || fullName.isBlank() ? "there" : fullName.trim();
			SimpleMailMessage message = new SimpleMailMessage();
			message.setFrom(fromAddress);
			message.setTo(toEmail);
			message.setSubject("Welcome to MedNexus");
			message.setText("""
					Hello %s,

					Welcome to MedNexus!

					Your account has been created successfully. You can now browse medicines, explore partner pharmacies, and manage your orders with confidence.

					Thank you for joining us.

					— The MedNexus Team
					""".formatted(greetingName));
			mailSender.send(message);
		} catch (Exception ex) {
			log.error("Failed to send welcome email to {}", toEmail, ex);
		}
	}

	public void sendVendorPendingApprovalEmail(String toEmail, String vendorName, String businessName) {
		try {
			String greetingName = vendorName == null || vendorName.isBlank() ? "there" : vendorName.trim();
			String business = businessName == null || businessName.isBlank() ? "your pharmacy" : businessName.trim();
			SimpleMailMessage message = new SimpleMailMessage();
			message.setFrom(fromAddress);
			message.setTo(toEmail);
			message.setSubject("Your MedNexus vendor application is under review");
			message.setText("""
					Hello %s,

					Thank you for applying to join MedNexus as a partner pharmacy.

					We have received your application for %s. Your request is currently pending admin review.

					Our team will verify your documents and business details. You will receive another email once your account is approved.

					— The MedNexus Team
					""".formatted(greetingName, business));
			mailSender.send(message);
		} catch (Exception ex) {
			log.error("Failed to send vendor pending approval email to {}", toEmail, ex);
		}
	}

	public void sendVendorApprovedWelcomeEmail(String toEmail, String vendorName, String businessName) {
		try {
			String greetingName = vendorName == null || vendorName.isBlank() ? "there" : vendorName.trim();
			String business = businessName == null || businessName.isBlank() ? "your pharmacy" : businessName.trim();
			SimpleMailMessage message = new SimpleMailMessage();
			message.setFrom(fromAddress);
			message.setTo(toEmail);
			message.setSubject("Welcome to the MedNexus vendor portal");
			message.setText("""
					Hello %s,

					Great news — your vendor application for %s has been approved!

					Welcome to the MedNexus vendor portal. You can now log in to manage products, track orders, and grow your online presence with us.

					Thank you for partnering with MedNexus.

					— The MedNexus Team
					""".formatted(greetingName, business));
			mailSender.send(message);
		} catch (Exception ex) {
			log.error("Failed to send vendor approved welcome email to {}", toEmail, ex);
		}
	}
}
