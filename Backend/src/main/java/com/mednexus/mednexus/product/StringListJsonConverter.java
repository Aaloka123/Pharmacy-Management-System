package com.mednexus.mednexus.product;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

@Converter
public class StringListJsonConverter implements AttributeConverter<List<String>, String> {

	private static final String DELIMITER = "\u001E";

	@Override
	public String convertToDatabaseColumn(List<String> attribute) {
		if (attribute == null || attribute.isEmpty()) {
			return "";
		}
		return attribute.stream()
				.map(value -> value == null ? "" : value.replace(DELIMITER, " "))
				.collect(Collectors.joining(DELIMITER));
	}

	@Override
	public List<String> convertToEntityAttribute(String dbData) {
		if (dbData == null || dbData.isBlank()) {
			return new ArrayList<>();
		}
		return Arrays.stream(dbData.split(DELIMITER, -1))
				.map(String::trim)
				.filter(value -> !value.isBlank())
				.collect(Collectors.toCollection(ArrayList::new));
	}
}
