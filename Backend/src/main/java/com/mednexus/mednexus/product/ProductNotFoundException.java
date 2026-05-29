package com.mednexus.mednexus.product;

public class ProductNotFoundException extends RuntimeException {

	public ProductNotFoundException() {
		super("Product not found");
	}
}
