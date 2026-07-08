package com.mednexus.mednexus.admin.dto;

import java.math.BigDecimal;
import java.util.List;

public record AdminProfitResponse(
		BigDecimal totalAdminProfit,
		String periodLabel,
		List<AdminProductProfitItem> products) {
}
