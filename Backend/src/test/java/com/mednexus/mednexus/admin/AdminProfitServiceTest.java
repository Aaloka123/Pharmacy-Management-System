package com.mednexus.mednexus.admin;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class AdminProfitServiceTest {

	@Autowired
	private AdminProfitService adminProfitService;

	@Test
	void listProductProfitDoesNotThrow() {
		adminProfitService.listProductProfit(null, null, true);
	}
}
