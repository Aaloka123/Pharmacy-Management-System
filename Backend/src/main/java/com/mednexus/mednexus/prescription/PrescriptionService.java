package com.mednexus.mednexus.prescription;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import com.mednexus.mednexus.prescription.dto.PrescriptionDetailResponse;
import com.mednexus.mednexus.prescription.dto.PrescriptionMedicineItem;
import com.mednexus.mednexus.prescription.dto.PrescriptionOcrResponse;
import com.mednexus.mednexus.prescription.dto.PrescriptionSummaryResponse;
import com.mednexus.mednexus.storage.MediaUrlUtils;
import com.mednexus.mednexus.user.User;
import com.mednexus.mednexus.user.UserRepository;

@Service
public class PrescriptionService {

	private static final int PREVIEW_MAX_LENGTH = 120;

	private final PrescriptionOcrService prescriptionOcrService;
	private final PrescriptionFileStorage prescriptionFileStorage;
	private final PrescriptionRepository prescriptionRepository;
	private final UserRepository userRepository;
	private final ObjectMapper objectMapper;

	public PrescriptionService(
			PrescriptionOcrService prescriptionOcrService,
			PrescriptionFileStorage prescriptionFileStorage,
			PrescriptionRepository prescriptionRepository,
			UserRepository userRepository,
			ObjectMapper objectMapper) {
		this.prescriptionOcrService = prescriptionOcrService;
		this.prescriptionFileStorage = prescriptionFileStorage;
		this.prescriptionRepository = prescriptionRepository;
		this.userRepository = userRepository;
		this.objectMapper = objectMapper;
	}

	@Transactional
	public PrescriptionDetailResponse scanAndSave(Long userId, MultipartFile file) {
		User user = userRepository.findById(userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

		PrescriptionOcrResponse ocr = prescriptionOcrService.readPrescription(file);
		String imageUrl = prescriptionFileStorage.store(file, userId);

		Prescription prescription = new Prescription();
		prescription.setUser(user);
		prescription.setImageUrl(imageUrl);
		prescription.setFullText(ocr.fullText());
		prescription.setMedicinesJson(serializeMedicines(ocr.medicines()));
		prescription.setDoctorNotes(ocr.doctorNotes());

		Prescription saved = prescriptionRepository.save(prescription);
		return toDetail(saved);
	}

	@Transactional(readOnly = true)
	public List<PrescriptionSummaryResponse> listForUser(Long userId) {
		return prescriptionRepository.findByUser_IdOrderByCreatedAtDesc(userId).stream()
				.map(this::toSummary)
				.toList();
	}

	@Transactional(readOnly = true)
	public PrescriptionDetailResponse getForUser(Long userId, Long id) {
		Prescription prescription = prescriptionRepository.findByIdAndUser_Id(id, userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Prescription not found"));
		return toDetail(prescription);
	}

	@Transactional
	public void deleteForUser(Long userId, Long id) {
		Prescription prescription = prescriptionRepository.findByIdAndUser_Id(id, userId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Prescription not found"));
		prescriptionFileStorage.deleteByUrl(prescription.getImageUrl());
		prescriptionRepository.delete(prescription);
	}

	private PrescriptionDetailResponse toDetail(Prescription prescription) {
		return new PrescriptionDetailResponse(
				prescription.getId(),
				normalizeImageUrl(prescription.getImageUrl()),
				prescription.getFullText(),
				deserializeMedicines(prescription.getMedicinesJson()),
				prescription.getDoctorNotes() == null ? "" : prescription.getDoctorNotes(),
				prescription.getCreatedAt());
	}

	private PrescriptionSummaryResponse toSummary(Prescription prescription) {
		List<PrescriptionMedicineItem> medicines = deserializeMedicines(prescription.getMedicinesJson());
		return new PrescriptionSummaryResponse(
				prescription.getId(),
				normalizeImageUrl(prescription.getImageUrl()),
				buildPreviewText(prescription.getFullText(), medicines),
				medicines.size(),
				prescription.getCreatedAt());
	}

	private String buildPreviewText(String fullText, List<PrescriptionMedicineItem> medicines) {
		String trimmed = fullText == null ? "" : fullText.trim();
		if (!trimmed.isBlank()) {
			return trimmed.length() <= PREVIEW_MAX_LENGTH
					? trimmed
					: trimmed.substring(0, PREVIEW_MAX_LENGTH).trim() + "…";
		}
		if (!medicines.isEmpty()) {
			return medicines.get(0).name();
		}
		return "Prescription scan";
	}

	private String normalizeImageUrl(String url) {
		String normalized = MediaUrlUtils.normalizeStoredUrl(url);
		return normalized == null ? url : normalized;
	}

	private String serializeMedicines(List<PrescriptionMedicineItem> medicines) {
		try {
			return objectMapper.writeValueAsString(medicines == null ? List.of() : medicines);
		} catch (Exception ex) {
			throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Could not save prescription medicines");
		}
	}

	private List<PrescriptionMedicineItem> deserializeMedicines(String json) {
		if (json == null || json.isBlank()) {
			return List.of();
		}
		try {
			return objectMapper.readValue(json, new TypeReference<List<PrescriptionMedicineItem>>() {
			});
		} catch (Exception ex) {
			return List.of();
		}
	}
}
