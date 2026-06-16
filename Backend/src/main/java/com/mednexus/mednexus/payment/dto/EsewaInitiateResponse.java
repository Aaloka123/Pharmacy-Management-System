package com.mednexus.mednexus.payment.dto;

import java.util.Map;

public record EsewaInitiateResponse(
		String formUrl,
		Map<String, String> fields) {
}
