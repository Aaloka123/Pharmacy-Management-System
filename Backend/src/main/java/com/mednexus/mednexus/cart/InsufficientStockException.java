package com.mednexus.mednexus.cart;

public class InsufficientStockException extends RuntimeException {

	public InsufficientStockException(int availableStock) {
		super(availableStock <= 0
				? "This product is out of stock."
				: "Only " + availableStock + " units available in stock.");
	}
}
