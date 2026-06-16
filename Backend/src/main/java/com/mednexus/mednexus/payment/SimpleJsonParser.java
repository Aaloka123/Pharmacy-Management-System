package com.mednexus.mednexus.payment;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

final class SimpleJsonParser {

	private static final Pattern STRING_FIELD = Pattern.compile("\"([^\"]+)\"\\s*:\\s*\"([^\"]*)\"");
	private static final Pattern NUMBER_FIELD = Pattern.compile("\"([^\"]+)\"\\s*:\\s*([0-9]+(?:\\.[0-9]+)?)");

	private SimpleJsonParser() {
	}

	static Map<String, String> parseObject(String json) {
		Map<String, String> fields = new LinkedHashMap<>();
		if (json == null || json.isBlank()) {
			return fields;
		}
		Matcher stringMatcher = STRING_FIELD.matcher(json);
		while (stringMatcher.find()) {
			fields.put(stringMatcher.group(1), stringMatcher.group(2));
		}
		Matcher numberMatcher = NUMBER_FIELD.matcher(json);
		while (numberMatcher.find()) {
			fields.putIfAbsent(numberMatcher.group(1), numberMatcher.group(2));
		}
		return fields;
	}

	static String stringValue(Map<String, String> fields, String key) {
		return fields.getOrDefault(key, "");
	}
}
