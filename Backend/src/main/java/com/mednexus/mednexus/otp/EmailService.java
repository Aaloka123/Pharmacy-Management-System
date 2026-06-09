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
		try {
			SimpleMailMessage message = new SimpleMailMessage();
			message.setFrom(fromAddress);
			message.setTo(toEmail);
			message.setSubject("Your MedNexus login verification code");
			message.setText("Your MedNexus verification code is: %s\n\nExpires in 10 minutes.".formatted(code));
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
}
