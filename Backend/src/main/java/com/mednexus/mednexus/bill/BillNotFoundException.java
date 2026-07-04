package com.mednexus.mednexus.bill;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class BillNotFoundException extends RuntimeException {

	public BillNotFoundException() {
		super("Bill not found");
	}
}
