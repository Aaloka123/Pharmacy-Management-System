package com.mednexus.mednexus.product;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.mednexus.mednexus.product.dto.ProductResponse;

@RestController
@RequestMapping("/api/admin/products")
@PreAuthorize("hasRole('ADMIN') and !principal.vendorAccount")
public class AdminProductController {

	private final ProductService productService;

	@Autowired
	public AdminProductController(ProductService productService) {
		this.productService = productService;
	}

	@GetMapping
	public ResponseEntity<List<ProductResponse>> listProducts() {
		return ResponseEntity.ok(productService.listForAdmin());
	}
}
