package com.mednexus.mednexus.admin;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class AdminDashboardServiceTest {

	@Autowired
	private AdminDashboardService adminDashboardService;

	@Test
	void getDashboardDoesNotThrow() {
		adminDashboardService.getDashboard();
	}
}
