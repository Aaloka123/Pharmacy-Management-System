package com.mednexus.mednexus.product;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ProductExpiryScheduler {

	private final ProductService productService;

	@Autowired
	public ProductExpiryScheduler(ProductService productService) {
		this.productService = productService;
	}

	@Scheduled(cron = "0 5 0 * * *")
	void deactivateExpiredProducts() {
		productService.deactivateExpiredProducts();
	}
}
