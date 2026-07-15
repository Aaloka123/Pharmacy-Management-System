package com.mednexus.mednexus.prescription;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.mednexus.mednexus.prescription.dto.PrescriptionDetailResponse;
import com.mednexus.mednexus.prescription.dto.PrescriptionSummaryResponse;
import com.mednexus.mednexus.security.PlatformUser;

@RestController
@RequestMapping("/api/prescription")
@PreAuthorize("hasRole('USER') and !principal.vendorAccount")
public class PrescriptionOcrController {

	private final PrescriptionService prescriptionService;

	public PrescriptionOcrController(PrescriptionService prescriptionService) {
		this.prescriptionService = prescriptionService;
	}

	@PostMapping(value = "/ocr", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<PrescriptionDetailResponse> scanPrescription(
			@AuthenticationPrincipal PlatformUser principal,
			@RequestPart("file") MultipartFile file) {
		return ResponseEntity.ok(prescriptionService.scanAndSave(principal.getSubjectId(), file));
	}

	@GetMapping
	public ResponseEntity<List<PrescriptionSummaryResponse>> listMyPrescriptions(
			@AuthenticationPrincipal PlatformUser principal) {
		return ResponseEntity.ok(prescriptionService.listForUser(principal.getSubjectId()));
	}

	@GetMapping("/{id}")
	public ResponseEntity<PrescriptionDetailResponse> getPrescription(
			@AuthenticationPrincipal PlatformUser principal,
			@PathVariable Long id) {
		return ResponseEntity.ok(prescriptionService.getForUser(principal.getSubjectId(), id));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<Void> deletePrescription(
			@AuthenticationPrincipal PlatformUser principal,
			@PathVariable Long id) {
		prescriptionService.deleteForUser(principal.getSubjectId(), id);
		return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
	}
}
