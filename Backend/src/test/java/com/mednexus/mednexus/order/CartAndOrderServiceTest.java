package com.mednexus.mednexus.order;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import com.mednexus.mednexus.cart.CartService;
import com.mednexus.mednexus.cart.dto.CartItemResponse;
import com.mednexus.mednexus.order.dto.VendorOrderResponse;

@SpringBootTest
class CartAndOrderServiceTest {

	private static final long NON_EXISTENT_USER_ID = 9_999_999_999L;

	@Autowired
	private CartService cartService;

	@Autowired
	private VendorOrderService vendorOrderService;

	@Test
	void listCartForUnknownUserReturnsEmptyList() {
		List<CartItemResponse> cart = cartService.listForUser(NON_EXISTENT_USER_ID);
		assertNotNull(cart);
		assertTrue(cart.isEmpty());
	}

	@Test
	void listOrdersForUnknownUserReturnsEmptyList() {
		List<VendorOrderResponse> orders = vendorOrderService.listForUser(NON_EXISTENT_USER_ID);
		assertNotNull(orders);
		assertTrue(orders.isEmpty());
	}
}
