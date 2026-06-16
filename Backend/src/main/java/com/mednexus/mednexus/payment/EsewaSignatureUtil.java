package com.mednexus.mednexus.payment;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

final class EsewaSignatureUtil {

	private EsewaSignatureUtil() {
	}

	static String sign(String message, String secretKey) {
		try {
			Mac mac = Mac.getInstance("HmacSHA256");
			SecretKeySpec keySpec = new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
			mac.init(keySpec);
			byte[] hash = mac.doFinal(message.getBytes(StandardCharsets.UTF_8));
			return Base64.getEncoder().encodeToString(hash);
		} catch (Exception ex) {
			throw new IllegalStateException("Failed to generate eSewa signature", ex);
		}
	}

	static String buildSignedMessage(Map<String, String> fields, String signedFieldNames) {
		String[] names = signedFieldNames.split(",");
		StringBuilder message = new StringBuilder();
		for (int i = 0; i < names.length; i++) {
			if (i > 0) {
				message.append(',');
			}
			String name = names[i].trim();
			message.append(name).append('=').append(fields.get(name));
		}
		return message.toString();
	}

	static boolean verify(Map<String, String> fields, String signedFieldNames, String signature, String secretKey) {
		if (signature == null || signature.isBlank()) {
			return false;
		}
		String expected = sign(buildSignedMessage(fields, signedFieldNames), secretKey);
		return expected.equals(signature);
	}
}
