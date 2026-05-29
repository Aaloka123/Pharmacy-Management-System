package com.mednexus.mednexus.product;

public class DuplicateProductSkuException extends RuntimeException {

	public DuplicateProductSkuException() {
		super("A product with this SKU already exists for your store");
	}
}
