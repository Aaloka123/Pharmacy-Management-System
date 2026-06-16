package com.mednexus.mednexus.cart;

public class VendorStoreClosedException extends RuntimeException {

	public VendorStoreClosedException(String vendorName) {
		super(vendorName + " is currently closed. Remove items from this vendor to continue.");
	}
}
