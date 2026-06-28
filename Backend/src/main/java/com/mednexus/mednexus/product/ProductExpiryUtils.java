package com.mednexus.mednexus.product;

import java.time.LocalDate;

public final class ProductExpiryUtils {

	private ProductExpiryUtils() {
	}

	public static boolean isExpired(LocalDate expiryDate) {
		if (expiryDate == null) {
			return false;
		}
		return expiryDate.isBefore(LocalDate.now());
	}
}
