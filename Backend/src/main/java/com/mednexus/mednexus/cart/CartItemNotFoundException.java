package com.mednexus.mednexus.cart;

public class CartItemNotFoundException extends RuntimeException {

	public CartItemNotFoundException() {
		super("Cart item not found");
	}
}
