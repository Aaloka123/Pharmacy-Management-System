package com.mednexus.mednexus.prescription;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.mednexus.mednexus.prescription.dto.PrescriptionOcrResponse;

@RestController
@RequestMapping("/api/prescription")
public class PrescriptionOcrController {

	private final PrescriptionOcrService prescriptionOcrService;

	public PrescriptionOcrController(PrescriptionOcrService prescriptionOcrService) {
		this.prescriptionOcrService = prescriptionOcrService;
	}

	@PostMapping(value = "/ocr", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@PreAuthorize("hasRole('USER') and !principal.vendorAccount")
	public ResponseEntity<PrescriptionOcrResponse> readPrescription(@RequestPart("file") MultipartFile file) {
		return ResponseEntity.ok(prescriptionOcrService.readPrescription(file));
	}
}
