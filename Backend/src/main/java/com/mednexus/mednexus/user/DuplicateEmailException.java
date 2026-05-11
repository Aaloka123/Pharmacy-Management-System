package com.mednexus.mednexus.user;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.CONFLICT)
public class DuplicateEmailException extends RuntimeException {

	public DuplicateEmailException() {
		super("Email is already registered");
	}
}
