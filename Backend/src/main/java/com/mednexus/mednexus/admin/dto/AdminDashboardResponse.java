package com.mednexus.mednexus.admin.dto;

import java.math.BigDecimal;
import java.util.List;

public record AdminDashboardResponse(
		AdminDashboardStats stats,
		AdminDashboardCharts charts,
		List<AdminPendingVendorItem> pendingVendors,
		List<AdminTopVendorItem> topVendors,
		List<AdminRecentActivityItem> recentActivity) {

	public record AdminDashboardStats(
			long totalUsers,
			long activeVendors,
			long pendingVendors,
			long totalOrders,
			long ordersThisWeek,
			BigDecimal platformRevenue,
			long totalProducts,
			String ordersChangeLabel,
			String revenueChangeLabel) {
	}

	public record AdminDashboardCharts(
			List<AdminChartMonthPoint> revenueByMonth,
			List<AdminChartMonthPoint> ordersByMonth,
			List<AdminVendorStatusSlice> vendorStatusBreakdown) {
	}

	public record AdminChartMonthPoint(
			String label,
			double value) {
	}

	public record AdminVendorStatusSlice(
			String label,
			long count,
			String color) {
	}

	public record AdminPendingVendorItem(
			long id,
			String businessName,
			String ownerName,
			String city,
			String appliedAt) {
	}

	public record AdminTopVendorItem(
			long vendorId,
			String businessName,
			String profileImage,
			long orderCount,
			BigDecimal revenue,
			Double averageRating) {
	}

	public record AdminRecentActivityItem(
			String action,
			String detail,
			String occurredAt,
			String tone) {
	}
}
