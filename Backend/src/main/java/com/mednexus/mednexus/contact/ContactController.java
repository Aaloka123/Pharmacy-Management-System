package com.mednexus.mednexus.contact;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.mednexus.mednexus.contact.dto.ContactMessageRequest;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/contact")
public class ContactController {

	private final ContactService contactService;

	@Autowired
	public ContactController(ContactService contactService) {
		this.contactService = contactService;
	}

	@PostMapping
	public ResponseEntity<Void> submit(@Valid @RequestBody ContactMessageRequest request) {
		contactService.submitContactMessage(request);
		return ResponseEntity.noContent().build();
	}
}
