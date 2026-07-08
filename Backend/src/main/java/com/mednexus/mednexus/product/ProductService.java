package com.mednexus.mednexus.product;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.mednexus.mednexus.cart.CartService;
import com.mednexus.mednexus.product.dto.ProductResponse;
import com.mednexus.mednexus.product.dto.ProductWriteRequest;
import com.mednexus.mednexus.storage.MediaUrlUtils;
import com.mednexus.mednexus.vendor.Vendor;
import com.mednexus.mednexus.vendor.VendorNotApprovedException;
import com.mednexus.mednexus.vendor.VendorRepository;
import com.mednexus.mednexus.vendor.VendorStatus;
import com.mednexus.mednexus.vendor.StoreStatus;

@Service
public class ProductService {

	private static final int MAX_IMAGES = 4;

	private final ProductRepository productRepository;
	private final VendorRepository vendorRepository;
	private final ProductFileStorage fileStorage;
	private final CartService cartService;

	@Autowired
	public ProductService(
			ProductRepository productRepository,
			VendorRepository vendorRepository,
			ProductFileStorage fileStorage,
			CartService cartService) {
		this.productRepository = productRepository;
		this.vendorRepository = vendorRepository;
		this.fileStorage = fileStorage;
		this.cartService = cartService;
	}

	@Transactional(readOnly = true)
	public List<ProductResponse> listCatalog(String category) {
		String normalizedCategory = normalizeCategoryFilter(category);
		return productRepository
				.findCatalog(VendorStatus.APPROVED, StoreStatus.OPEN, ProductStatus.ACTIVE, normalizedCategory)
				.stream()
				.map(this::toResponse)
				.toList();
	}

	@Transactional(readOnly = true)
	public List<ProductResponse> listNewArrivals(int limit) {
		int capped = Math.min(Math.max(limit, 1), 20);
		return productRepository
				.findCatalog(VendorStatus.APPROVED, StoreStatus.OPEN, ProductStatus.ACTIVE, null)
				.stream()
				.limit(capped)
				.map(this::toResponse)
				.toList();
	}

	@Transactional(readOnly = true)
	public ProductResponse getCatalogProduct(Long id) {
		Product product = productRepository
				.findCatalogById(id, VendorStatus.APPROVED, StoreStatus.OPEN, ProductStatus.ACTIVE)
				.orElseThrow(ProductNotFoundException::new);
		return toResponse(product);
	}

	@Transactional
	public List<ProductResponse> listForVendor(Long vendorId) {
		List<Product> products = productRepository.findByVendorIdOrderByCreatedAtDesc(vendorId);
		deactivateExpiredInMemory(products);
		return products.stream().map(this::toResponse).toList();
	}

	@Transactional
	public List<ProductResponse> listForAdmin() {
		List<Product> products = productRepository.findAllWithVendorOrderByCreatedAtDesc();
		deactivateExpiredInMemory(products);
		return products.stream().map(this::toResponse).toList();
	}

	@Transactional
	public void deactivateExpiredProducts() {
		productRepository.deactivateExpiredActiveProducts(LocalDate.now());
	}

	@Transactional(readOnly = true)
	public List<ProductResponse> listCatalogForVendor(Long vendorId) {
		Vendor vendor = vendorRepository.findById(vendorId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vendor not found"));
		if (vendor.getStatus() != VendorStatus.APPROVED) {
			throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Vendor not found");
		}
		if (vendor.getStoreStatus() != StoreStatus.OPEN) {
			return List.of();
		}
		return productRepository
				.findCatalogByVendorId(vendorId, VendorStatus.APPROVED, StoreStatus.OPEN, ProductStatus.ACTIVE)
				.stream()
				.map(this::toResponse)
				.toList();
	}

	@Transactional
	public ProductResponse create(Long vendorId, ProductWriteRequest request, MultipartFile[] imageFiles) {
		Vendor vendor = requireApprovedVendor(vendorId);
		ValidatedProductFields fields = validateWriteRequest(request, vendorId, null);

		Product product = new Product();
		product.setVendor(vendor);
		applyFields(product, fields);
		product.setImages(resolveImages(List.of(), request.existingImages(), imageFiles, vendorId, null));
		return toResponse(productRepository.save(product));
	}

	@Transactional
	public ProductResponse update(Long vendorId, Long productId, ProductWriteRequest request, MultipartFile[] imageFiles) {
		requireApprovedVendor(vendorId);
		Product product = productRepository.findByIdAndVendorIdWithVendor(productId, vendorId)
				.orElseThrow(ProductNotFoundException::new);
		ValidatedProductFields fields = validateWriteRequest(request, vendorId, productId);

		List<String> previousImages = new ArrayList<>(product.getImages());
		if (!hasNewImageFiles(imageFiles) && imagesUnchanged(previousImages, request.existingImages())) {
			applyFields(product, fields);
			return toResponse(productRepository.save(product));
		}

		List<String> nextImages = resolveImages(previousImages, request.existingImages(), imageFiles, vendorId, productId);
		applyFields(product, fields);
		product.setImages(nextImages);

		List<String> removed = new ArrayList<>(previousImages);
		removed.removeAll(nextImages);
		Product saved = productRepository.save(product);
		deleteImagesAsync(removed);
		return toResponse(saved);
	}

	@Transactional
	public ProductResponse updateStatus(Long vendorId, Long productId, ProductStatus status) {
		requireApprovedVendor(vendorId);
		Product product = productRepository.findByIdAndVendorIdWithVendor(productId, vendorId)
				.orElseThrow(ProductNotFoundException::new);
		if (ProductExpiryUtils.isExpired(product.getExpiryDate()) && status == ProductStatus.ACTIVE) {
			throw new IllegalArgumentException(
					"This product has expired. Update the expiry date before activating it.");
		}
		if (status == ProductStatus.ACTIVE && product.getStock() <= 0) {
			throw new IllegalArgumentException("Cannot activate a product with zero stock.");
		}
		product.setStatus(status);
		return toResponse(productRepository.save(product));
	}

	@Transactional
	public void delete(Long vendorId, Long productId) {
		Product product = productRepository.findByIdAndVendorId(productId, vendorId)
				.orElseThrow(ProductNotFoundException::new);
		cartService.removeByProductId(productId);
		fileStorage.deleteByPublicUrls(product.getImages());
		productRepository.delete(product);
	}

	private Vendor requireApprovedVendor(Long vendorId) {
		Vendor vendor = vendorRepository.findById(vendorId)
				.orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Vendor not found"));
		if (vendor.getStatus() != VendorStatus.APPROVED) {
			throw new VendorNotApprovedException("Your vendor account must be approved before managing products");
		}
		return vendor;
	}

	private ValidatedProductFields validateWriteRequest(ProductWriteRequest request, Long vendorId, Long productId) {
		if (request == null) {
			throw new IllegalArgumentException("Product data is required");
		}
		if (request.productName() == null || request.productName().isBlank()) {
			throw new IllegalArgumentException("Product name is required");
		}
		if (request.sku() == null || request.sku().isBlank()) {
			throw new IllegalArgumentException("SKU is required");
		}
		if (request.category() == null || request.category().isBlank()) {
			throw new IllegalArgumentException("Category is required");
		}
		if (request.strength() == null || request.strength().isBlank()) {
			throw new IllegalArgumentException("Strength is required");
		}
		if (request.form() == null || request.form().isBlank()) {
			throw new IllegalArgumentException("Form is required");
		}
		if (request.quantity() == null || request.quantity().isBlank()) {
			throw new IllegalArgumentException("Quantity is required");
		}
		if (request.storageRequirements() == null || request.storageRequirements().isBlank()) {
			throw new IllegalArgumentException("Storage requirements are required");
		}
		if (request.expiryDate() == null) {
			throw new IllegalArgumentException("Expiry date is required");
		}
		if (request.productDescription() == null || request.productDescription().isBlank()) {
			throw new IllegalArgumentException("Product description is required");
		}
		if (request.price() == null || request.price().signum() < 0) {
			throw new IllegalArgumentException("Price must be zero or greater");
		}
		if (request.stock() == null || request.stock() < 0) {
			throw new IllegalArgumentException("Stock must be zero or greater");
		}

		String sku = request.sku().trim();
		boolean duplicate = productId == null
				? productRepository.existsByVendorIdAndSkuIgnoreCase(vendorId, sku)
				: productRepository.existsByVendorIdAndSkuIgnoreCaseAndIdNot(vendorId, sku, productId);
		if (duplicate) {
			throw new DuplicateProductSkuException();
		}

		List<String> dosage = request.dosageInstructions() != null ? request.dosageInstructions() : List.of();
		List<String> sideEffects = request.sideEffects() != null ? request.sideEffects() : List.of();
		if (dosage.isEmpty()) {
			throw new IllegalArgumentException("At least one dosage instruction is required");
		}
		if (sideEffects.isEmpty()) {
			throw new IllegalArgumentException("At least one side effect is required");
		}

		ProductStatus status = resolveProductStatus(request, request.expiryDate());

		return new ValidatedProductFields(
				request.productName().trim(),
				sku,
				request.category().trim(),
				request.strength().trim(),
				request.form().trim(),
				request.quantity().trim(),
				request.storageRequirements().trim(),
				request.expiryDate(),
				request.productDescription().trim(),
				dosage.stream().map(String::trim).filter(s -> !s.isBlank()).toList(),
				sideEffects.stream().map(String::trim).filter(s -> !s.isBlank()).toList(),
				request.price(),
				request.stock(),
				status);
	}

	private void applyFields(Product product, ValidatedProductFields fields) {
		product.setProductName(fields.productName());
		product.setSku(fields.sku());
		product.setCategory(fields.category());
		product.setStrength(fields.strength());
		product.setForm(fields.form());
		product.setQuantity(fields.quantity());
		product.setStorageRequirements(fields.storageRequirements());
		product.setExpiryDate(fields.expiryDate());
		product.setProductDescription(fields.productDescription());
		product.setDosageInstructions(fields.dosageInstructions());
		product.setSideEffects(fields.sideEffects());
		product.setPrice(fields.price());
		product.setStock(fields.stock());
		product.setStatus(fields.status());
	}

	private List<String> resolveImages(
			List<String> currentImages,
			List<String> existingImagesFromClient,
			MultipartFile[] imageFiles,
			Long vendorId,
			Long productId) {
		List<String> merged = new ArrayList<>();
		if (existingImagesFromClient != null) {
			for (String url : existingImagesFromClient) {
				String normalized = normalizeImageUrl(url);
				if (normalized != null && merged.size() < MAX_IMAGES) {
					merged.add(normalized);
				}
			}
		} else if (currentImages != null) {
			merged.addAll(currentImages);
		}

		if (imageFiles != null && merged.size() < MAX_IMAGES) {
			long storageKey = productId != null ? productId : System.currentTimeMillis();
			List<String> uploaded = fileStorage.storeAll(imageFiles, vendorId, storageKey);
			for (String url : uploaded) {
				if (merged.size() >= MAX_IMAGES) {
					break;
				}
				merged.add(url);
			}
		}
		if (merged.isEmpty()) {
			throw new IllegalArgumentException("At least one product image is required");
		}
		return merged;
	}

	private String normalizeImageUrl(String url) {
		return MediaUrlUtils.normalizeStoredUrl(url);
	}

	private String normalizeCategoryFilter(String category) {
		if (category == null || category.isBlank() || "All Medications".equalsIgnoreCase(category.trim())) {
			return null;
		}
		return category.trim();
	}

	private ProductStatus resolveProductStatus(ProductWriteRequest request, java.time.LocalDate expiryDate) {
		if (ProductExpiryUtils.isExpired(expiryDate)) {
			if (request.status() == ProductStatus.ACTIVE) {
				throw new IllegalArgumentException(
						"This product has expired. Update the expiry date before activating it.");
			}
			return ProductStatus.INACTIVE;
		}
		if (request.status() != null) {
			if (request.status() == ProductStatus.ACTIVE && request.stock() <= 0) {
				return ProductStatus.INACTIVE;
			}
			return request.status();
		}
		return request.stock() > 0 ? ProductStatus.ACTIVE : ProductStatus.INACTIVE;
	}

	private void deactivateExpiredInMemory(List<Product> products) {
		List<Product> expiredActive = products.stream()
				.filter(product -> product.getStatus() == ProductStatus.ACTIVE)
				.filter(product -> ProductExpiryUtils.isExpired(product.getExpiryDate()))
				.toList();
		if (expiredActive.isEmpty()) {
			return;
		}
		for (Product product : expiredActive) {
			product.setStatus(ProductStatus.INACTIVE);
		}
		productRepository.saveAll(expiredActive);
	}

	private boolean hasNewImageFiles(MultipartFile[] imageFiles) {
		if (imageFiles == null) {
			return false;
		}
		for (MultipartFile file : imageFiles) {
			if (file != null && !file.isEmpty()) {
				return true;
			}
		}
		return false;
	}

	private boolean imagesUnchanged(List<String> storedImages, List<String> existingImagesFromClient) {
		if (existingImagesFromClient == null) {
			return false;
		}
		if (storedImages.size() != existingImagesFromClient.size()) {
			return false;
		}
		for (int i = 0; i < storedImages.size(); i++) {
			String stored = normalizeImageUrl(storedImages.get(i));
			String client = normalizeImageUrl(existingImagesFromClient.get(i));
			if (stored == null || client == null || !stored.equals(client)) {
				return false;
			}
		}
		return true;
	}

	private void deleteImagesAsync(List<String> removed) {
		if (removed == null || removed.isEmpty()) {
			return;
		}
		List<String> copy = List.copyOf(removed);
		CompletableFuture.runAsync(() -> fileStorage.deleteByPublicUrls(copy));
	}

	private ProductResponse toResponse(Product product) {
		Vendor vendor = product.getVendor();
		return new ProductResponse(
				product.getId(),
				vendor.getId(),
				vendor.getBusinessName(),
				vendor.getBusinessLocation(),
				product.getProductName(),
				product.getSku(),
				product.getCategory(),
				product.getStrength(),
				product.getForm(),
				product.getQuantity(),
				product.getStorageRequirements(),
				product.getExpiryDate(),
				product.getProductDescription(),
				product.getDosageInstructions(),
				product.getSideEffects(),
				product.getPrice(),
				product.getStock(),
				product.getStatus(),
				product.getImages(),
				product.getCreatedAt(),
				product.getUpdatedAt());
	}

	private record ValidatedProductFields(
			String productName,
			String sku,
			String category,
			String strength,
			String form,
			String quantity,
			String storageRequirements,
			java.time.LocalDate expiryDate,
			String productDescription,
			List<String> dosageInstructions,
			List<String> sideEffects,
			BigDecimal price,
			int stock,
			ProductStatus status) {
	}
}
