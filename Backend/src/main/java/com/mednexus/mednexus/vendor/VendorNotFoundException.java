package com.mednexus.mednexus.vendor;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class VendorNotFoundException extends RuntimeException {

	public VendorNotFoundException() {
		super("Vendor not found");
	}
}
