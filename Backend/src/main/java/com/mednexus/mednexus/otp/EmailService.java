package com.mednexus.mednexus.otp;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

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
		SimpleMailMessage message = new SimpleMailMessage();
		message.setFrom(fromAddress);
		message.setTo(toEmail);
		message.setSubject("Your MedNexus login verification code");
		message.setText("""
				Hello,

				Your one-time verification code is: %s

				This code expires in 10 minutes. If you did not try to log in, you can ignore this email.

				— MedNexus
				""".formatted(code));
		mailSender.send(message);
	}
}
