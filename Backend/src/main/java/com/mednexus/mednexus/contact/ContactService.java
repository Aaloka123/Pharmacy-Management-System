package com.mednexus.mednexus.contact;

import java.util.concurrent.Executor;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import com.mednexus.mednexus.contact.dto.ContactMessageRequest;
import com.mednexus.mednexus.otp.EmailService;

@Service
public class ContactService {

	private final EmailService emailService;
	private final Executor mailExecutor;
	private final String adminEmail;

	@Autowired
	public ContactService(
			EmailService emailService,
			@Qualifier("mailExecutor") Executor mailExecutor,
			@Value("${mednexus.mail.admin-email:${mednexus.mail.from:${spring.mail.username:}}}") String adminEmail) {
		this.emailService = emailService;
		this.mailExecutor = mailExecutor;
		this.adminEmail = adminEmail == null ? "" : adminEmail.trim();
	}

	public void submitContactMessage(ContactMessageRequest request) {
		if (adminEmail.isBlank()) {
			throw new ResponseStatusException(
					HttpStatus.SERVICE_UNAVAILABLE,
					"Contact form is temporarily unavailable. Please try again later.");
		}

		String fullName = request.fullName().trim();
		String email = request.email().trim();
		String phone = request.phone().trim();
		String message = request.message().trim();

		mailExecutor.execute(() -> emailService.sendContactMessageToAdmin(adminEmail, fullName, email, phone, message));
	}
}
