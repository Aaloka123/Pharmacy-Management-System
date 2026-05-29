package com.mednexus.mednexus.product;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.mednexus.mednexus.product.dto.ProductResponse;
import com.mednexus.mednexus.product.dto.ProductWriteRequest;
import com.mednexus.mednexus.security.PlatformUser;

@RestController
@RequestMapping("/api")
public class ProductController {

	private final ProductService productService;

	@Autowired
	public ProductController(ProductService productService) {
		this.productService = productService;
	}

	@GetMapping("/products")
	public ResponseEntity<List<ProductResponse>> listPublic(
			@RequestParam(name = "category", required = false) String category) {
		return ResponseEntity.ok(productService.listCatalog(category));
	}

	@GetMapping("/products/{id}")
	public ResponseEntity<ProductResponse> getPublic(@PathVariable Long id) {
		return ResponseEntity.ok(productService.getCatalogProduct(id));
	}

	@GetMapping("/vendors/me/products")
	@PreAuthorize("hasRole('VENDOR') and principal.vendorAccount")
	public ResponseEntity<List<ProductResponse>> listMine(@AuthenticationPrincipal PlatformUser principal) {
		return ResponseEntity.ok(productService.listForVendor(principal.getSubjectId()));
	}

	@GetMapping("/vendors/{vendorId}/products")
	@PreAuthorize("hasRole('ADMIN')")
	public ResponseEntity<List<ProductResponse>> listByVendor(@PathVariable Long vendorId) {
		return ResponseEntity.ok(productService.listForVendor(vendorId));
	}

	@PostMapping(value = "/vendors/me/products", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@PreAuthorize("hasRole('VENDOR') and principal.vendorAccount")
	public ResponseEntity<ProductResponse> create(
			@AuthenticationPrincipal PlatformUser principal,
			@RequestPart("product") ProductWriteRequest product,
			@RequestPart(value = "images", required = false) MultipartFile[] images) {
		ProductResponse body = productService.create(principal.getSubjectId(), product, images);
		return ResponseEntity.status(HttpStatus.CREATED).body(body);
	}

	@PutMapping(value = "/vendors/me/products/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	@PreAuthorize("hasRole('VENDOR') and principal.vendorAccount")
	public ResponseEntity<ProductResponse> update(
			@AuthenticationPrincipal PlatformUser principal,
			@PathVariable Long id,
			@RequestPart("product") ProductWriteRequest product,
			@RequestPart(value = "images", required = false) MultipartFile[] images) {
		return ResponseEntity.ok(productService.update(principal.getSubjectId(), id, product, images));
	}

	@DeleteMapping("/vendors/me/products/{id}")
	@PreAuthorize("hasRole('VENDOR') and principal.vendorAccount")
	public ResponseEntity<Void> delete(
			@AuthenticationPrincipal PlatformUser principal,
			@PathVariable Long id) {
		productService.delete(principal.getSubjectId(), id);
		return ResponseEntity.noContent().build();
	}
}
