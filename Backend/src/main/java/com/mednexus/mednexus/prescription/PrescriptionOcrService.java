package com.mednexus.mednexus.prescription;

import java.util.Base64;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.mednexus.mednexus.chatbot.ChatbotUnavailableException;
import com.mednexus.mednexus.chatbot.OllamaClient;
import com.mednexus.mednexus.chatbot.OllamaProperties;
import com.mednexus.mednexus.chatbot.dto.OllamaChatMessage;
import com.mednexus.mednexus.prescription.dto.PrescriptionMedicineItem;
import com.mednexus.mednexus.prescription.dto.PrescriptionOcrResponse;

@Service
public class PrescriptionOcrService {

	private static final Logger log = LoggerFactory.getLogger(PrescriptionOcrService.class);

	private static final long MAX_BYTES = 10L * 1024 * 1024;
	private static final Pattern JSON_BLOCK = Pattern.compile("```(?:json)?\\s*([\\s\\S]*?)```", Pattern.CASE_INSENSITIVE);

	private static final String VERBATIM_OCR_PROMPT = """
			Transcribe every visible word and number on this prescription photo exactly as written.
			Rules:
			- Output plain text only, one line per line of the prescription, in reading order
			- Keep original spelling, abbreviations (OD, BD, TDS, SOS), numbers, and units
			- If a word is unreadable, write [unclear] for that part only
			- Do NOT guess, interpret, summarize, or add medicines not visible in the image
			- Do NOT return JSON or markdown
			""";

	private static final String STRUCTURE_SYSTEM_PROMPT = """
			You structure prescription transcriptions into JSON.
			Use ONLY information that appears in the transcription. Never invent medicines or doses.
			Return ONLY valid JSON with this shape:
			{
			  "fullText": "same transcription text",
			  "medicines": [
			    { "name": "medicine name", "dosage": "strength or dose", "frequency": "how often", "duration": "how long" }
			  ],
			  "doctorNotes": "patient name, doctor name, date, or other notes from the transcription"
			}
			Use empty strings for unknown fields. Do not wrap the JSON in markdown.
			""";


	private final OllamaClient ollamaClient;
	private final OllamaProperties ollamaProperties;
	private final ObjectMapper objectMapper;

	public PrescriptionOcrService(OllamaClient ollamaClient, OllamaProperties ollamaProperties, ObjectMapper objectMapper) {
		this.ollamaClient = ollamaClient;
		this.ollamaProperties = ollamaProperties;
		this.objectMapper = objectMapper;
	}

	public PrescriptionOcrResponse readPrescription(MultipartFile file) {
		validateImage(file);
		String base64Image = encodeImage(file);
		try {
			log.info("Starting prescription OCR with vision model {}", ollamaProperties.getVisionModel());
			long visionStart = System.currentTimeMillis();
			String transcription = ollamaClient.chatWithImage(
					ollamaProperties.getVisionModel(),
					VERBATIM_OCR_PROMPT,
					base64Image);
			log.info("Prescription vision OCR finished in {} ms", System.currentTimeMillis() - visionStart);
			if (transcription == null || transcription.isBlank()) {
				return new PrescriptionOcrResponse("", List.of(), "");
			}

			long structureStart = System.currentTimeMillis();
			String structured = ollamaClient.chat(List.of(
					new OllamaChatMessage("system", STRUCTURE_SYSTEM_PROMPT),
					new OllamaChatMessage("user", "Prescription transcription:\n" + transcription.trim())));
			log.info("Prescription structuring finished in {} ms", System.currentTimeMillis() - structureStart);

			PrescriptionOcrResponse parsed = parseResponse(structured);
			return mergeTranscription(transcription.trim(), parsed);
		} catch (ChatbotUnavailableException ex) {
			throw ex;
		} catch (RuntimeException ex) {
			throw new ResponseStatusException(
					HttpStatus.BAD_GATEWAY,
					"Could not read prescription image. Make sure Ollama is running with "
							+ ollamaProperties.getVisionModel()
							+ ".");
		}
	}

	private PrescriptionOcrResponse mergeTranscription(String transcription, PrescriptionOcrResponse parsed) {
		List<PrescriptionMedicineItem> medicines = parsed.medicines();
		String doctorNotes = parsed.doctorNotes();
		if (medicines.isEmpty()) {
			medicines = inferMedicinesFromLines(transcription);
		}
		return new PrescriptionOcrResponse(transcription, medicines, doctorNotes);
	}

	private List<PrescriptionMedicineItem> inferMedicinesFromLines(String transcription) {
		return transcription.lines()
				.map(String::trim)
				.filter(line -> !line.isBlank())
				.filter(line -> !line.startsWith("["))
				.filter(this::looksLikeMedicineLine)
				.map(line -> new PrescriptionMedicineItem(line, "", "", ""))
				.toList();
	}

	private boolean looksLikeMedicineLine(String line) {
		String lower = line.toLowerCase();
		if (lower.length() < 3) {
			return false;
		}
		return lower.contains("mg")
				|| lower.contains("ml")
				|| lower.contains("tab")
				|| lower.contains("cap")
				|| lower.contains("syr")
				|| lower.contains("inj")
				|| lower.matches(".*\\d.*");
	}

	private void validateImage(MultipartFile file) {
		if (file == null || file.isEmpty()) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Prescription image is required");
		}
		if (file.getSize() > MAX_BYTES) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image must be 10 MB or smaller");
		}
		String contentType = file.getContentType();
		if (contentType == null || !contentType.startsWith("image/")) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only image files are allowed");
		}
	}

	private String encodeImage(MultipartFile file) {
		try {
			byte[] prepared = PrescriptionImageUtils.prepareForOcr(file.getInputStream());
			log.info("Prepared prescription image for OCR: {} KB", prepared.length / 1024);
			return Base64.getEncoder().encodeToString(prepared);
		} catch (Exception ex) {
			throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Could not read uploaded image");
		}
	}

	private PrescriptionOcrResponse parseResponse(String rawResponse) {
		String trimmed = rawResponse == null ? "" : rawResponse.trim();
		if (trimmed.isBlank()) {
			return new PrescriptionOcrResponse("", List.of(), "");
		}

		String json = extractJson(trimmed);
		try {
			JsonNode root = objectMapper.readTree(json);
			String fullText = textOrEmpty(root.get("fullText"));
			String doctorNotes = textOrEmpty(root.get("doctorNotes"));
			List<PrescriptionMedicineItem> medicines = parseMedicines(root.get("medicines"));
			if (fullText.isBlank()) {
				fullText = trimmed;
			}
			return new PrescriptionOcrResponse(fullText, medicines, doctorNotes);
		} catch (Exception ex) {
			return new PrescriptionOcrResponse(trimmed, List.of(), "");
		}
	}

	private List<PrescriptionMedicineItem> parseMedicines(JsonNode medicinesNode) {
		if (medicinesNode == null || !medicinesNode.isArray()) {
			return List.of();
		}
		return java.util.stream.StreamSupport.stream(medicinesNode.spliterator(), false)
				.map(item -> new PrescriptionMedicineItem(
						textOrEmpty(item.get("name")),
						textOrEmpty(item.get("dosage")),
						textOrEmpty(item.get("frequency")),
						textOrEmpty(item.get("duration"))))
				.filter(item -> !item.name().isBlank())
				.toList();
	}

	private String extractJson(String value) {
		Matcher matcher = JSON_BLOCK.matcher(value);
		if (matcher.find()) {
			return matcher.group(1).trim();
		}
		int start = value.indexOf('{');
		int end = value.lastIndexOf('}');
		if (start >= 0 && end > start) {
			return value.substring(start, end + 1);
		}
		return value;
	}

	private String textOrEmpty(JsonNode node) {
		if (node == null || node.isNull()) {
			return "";
		}
		return node.asText("").trim();
	}
}
