package com.mednexus.mednexus.admin;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.mednexus.mednexus.admin.dto.AdminProfitResponse;

@RestController
@RequestMapping("/api/admin/profit")
@PreAuthorize("hasRole('ADMIN') and !principal.vendorAccount")
public class AdminProfitController {

	private final AdminProfitService adminProfitService;

	@Autowired
	public AdminProfitController(AdminProfitService adminProfitService) {
		this.adminProfitService = adminProfitService;
	}

	@GetMapping
	public ResponseEntity<AdminProfitResponse> listProductProfit(
			@RequestParam(required = false) Integer year,
			@RequestParam(required = false) Integer month,
			@RequestParam(required = false, defaultValue = "false") boolean all) {
		return ResponseEntity.ok(adminProfitService.listProductProfit(year, month, all));
	}
}
