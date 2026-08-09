package com.mednexus.mednexus.product;

import static org.junit.jupiter.api.Assertions.assertNotNull;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.mednexus.mednexus.product.dto.ProductResponse;

@SpringBootTest
class ProductCatalogServiceTest {

	@Autowired
	private ProductService productService;

	@Test
	void listCatalogReturnsList() {
		List<ProductResponse> products = productService.listCatalog(null);
		assertNotNull(products);
	}

	@Test
	void listNewArrivalsReturnsList() {
		List<ProductResponse> products = productService.listNewArrivals(5);
		assertNotNull(products);
	}
}
