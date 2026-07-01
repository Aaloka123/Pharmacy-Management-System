package com.mednexus.mednexus.vendor.dto;

import java.math.BigDecimal;
import java.util.List;

import com.mednexus.mednexus.order.dto.VendorOrderResponse;

public record VendorDashboardResponse(
		VendorDashboardStats stats,
		VendorDashboardCharts charts,
		List<VendorOrderResponse> recentOrders,
		List<VendorTopProductItem> topProducts,
		long unreadMessages) {

	public record VendorDashboardStats(
			BigDecimal totalRevenue,
			String revenueChangeLabel,
			long totalOrders,
			long ordersThisWeek,
			String ordersChangeLabel,
			long activeProducts,
			long lowStockCount,
			Double averageRating,
			long totalReviews) {
	}

	public record VendorDashboardCharts(
			List<VendorChartPoint> revenueByMonth,
			List<VendorChartPoint> ordersByDay,
			List<VendorStatusSlice> orderStatusBreakdown,
			List<VendorPaymentSlice> paymentMethodSplit,
			String topSellingDayLabel) {
	}

	public record VendorChartPoint(
			String label,
			double value) {
	}

	public record VendorStatusSlice(
			String label,
			long count,
			String color) {
	}

	public record VendorPaymentSlice(
			String label,
			int pct) {
	}

	public record VendorTopProductItem(
			long productId,
			String name,
			long sold,
			BigDecimal revenue,
			String imageUrl) {
	}
}
