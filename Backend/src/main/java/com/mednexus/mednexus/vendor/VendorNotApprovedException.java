package com.mednexus.mednexus.vendor;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.FORBIDDEN)
public class VendorNotApprovedException extends RuntimeException {

	public VendorNotApprovedException(String message) {
		super(message);
	}
}
