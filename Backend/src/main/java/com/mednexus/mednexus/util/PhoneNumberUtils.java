package com.mednexus.mednexus.util;

import java.util.regex.Pattern;

public final class PhoneNumberUtils {

	private static final Pattern TEN_DIGITS = Pattern.compile("\\d{10}");

	private PhoneNumberUtils() {
	}

	public static void requireValid(String phone, String fieldLabel) {
		if (phone == null || phone.isBlank()) {
			throw new IllegalArgumentException(fieldLabel + " is required");
		}
		if (!TEN_DIGITS.matcher(phone.trim()).matches()) {
			throw new IllegalArgumentException(fieldLabel + " must be exactly 10 digits");
		}
	}

	public static void requireValidIfPresent(String phone) {
		if (phone == null || phone.isBlank()) {
			return;
		}
		if (!TEN_DIGITS.matcher(phone.trim()).matches()) {
			throw new IllegalArgumentException("Phone number must be exactly 10 digits");
		}
	}

	public static String normalize(String phone) {
		return phone == null ? null : phone.trim();
	}

}
