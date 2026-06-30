package com.mednexus.mednexus.admin;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mednexus.mednexus.admin.dto.AdminDashboardResponse;
import com.mednexus.mednexus.admin.dto.AdminDashboardResponse.AdminChartMonthPoint;
import com.mednexus.mednexus.admin.dto.AdminDashboardResponse.AdminDashboardCharts;
import com.mednexus.mednexus.admin.dto.AdminDashboardResponse.AdminDashboardStats;
import com.mednexus.mednexus.admin.dto.AdminDashboardResponse.AdminPendingVendorItem;
import com.mednexus.mednexus.admin.dto.AdminDashboardResponse.AdminRecentActivityItem;
import com.mednexus.mednexus.admin.dto.AdminDashboardResponse.AdminTopVendorItem;
import com.mednexus.mednexus.admin.dto.AdminDashboardResponse.AdminVendorStatusSlice;
import com.mednexus.mednexus.order.OrderStatus;
import com.mednexus.mednexus.order.VendorOrder;
import com.mednexus.mednexus.order.VendorOrderRepository;
import com.mednexus.mednexus.product.ProductRepository;
import com.mednexus.mednexus.review.ProductReview;
import com.mednexus.mednexus.review.ProductReviewRepository;
import com.mednexus.mednexus.user.Role;
import com.mednexus.mednexus.user.UserRepository;
import com.mednexus.mednexus.vendor.StoreStatus;
import com.mednexus.mednexus.vendor.Vendor;
import com.mednexus.mednexus.vendor.VendorRepository;
import com.mednexus.mednexus.vendor.VendorStatus;

@Service
public class AdminDashboardService {

	private static final DateTimeFormatter APPLIED_DATE_FORMAT =
			DateTimeFormatter.ofPattern("d MMM yyyy", Locale.ENGLISH).withZone(ZoneOffset.UTC);

	private static final String[] MONTH_LABELS = {
			"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
	};

	private final UserRepository userRepository;
	private final VendorRepository vendorRepository;
	private final ProductRepository productRepository;
	private final VendorOrderRepository vendorOrderRepository;
	private final ProductReviewRepository productReviewRepository;

	@Autowired
	public AdminDashboardService(
			UserRepository userRepository,
			VendorRepository vendorRepository,
			ProductRepository productRepository,
			VendorOrderRepository vendorOrderRepository,
			ProductReviewRepository productReviewRepository) {
		this.userRepository = userRepository;
		this.vendorRepository = vendorRepository;
		this.productRepository = productRepository;
		this.vendorOrderRepository = vendorOrderRepository;
		this.productReviewRepository = productReviewRepository;
	}

	@Transactional(readOnly = true)
	public AdminDashboardResponse getDashboard() {
		Instant now = Instant.now();
		Instant weekStart = now.minus(7, ChronoUnit.DAYS);
		Instant previousWeekStart = now.minus(14, ChronoUnit.DAYS);
		ZonedDateTime zonedNow = ZonedDateTime.now(ZoneOffset.UTC);
		Instant monthStart = zonedNow.withDayOfMonth(1).truncatedTo(ChronoUnit.DAYS).toInstant();
		Instant previousMonthStart = zonedNow.minusMonths(1).withDayOfMonth(1).truncatedTo(ChronoUnit.DAYS).toInstant();
		Instant sixMonthsAgo = zonedNow.minusMonths(6).toInstant();

		long totalUsers = userRepository.countByRole(Role.USER);
		long activeVendors = vendorRepository.countByStatus(VendorStatus.APPROVED);
		long pendingVendors = vendorRepository.countByStatus(VendorStatus.PENDING);
		long totalOrders = vendorOrderRepository.countByStatusNot(OrderStatus.CANCELED);
		long ordersThisWeek = vendorOrderRepository.countByCreatedAtGreaterThanEqual(weekStart);
		long ordersPreviousWeek = vendorOrderRepository.countByCreatedAtGreaterThanEqualAndCreatedAtLessThan(
				previousWeekStart, weekStart);
		BigDecimal platformRevenue = nullToZero(vendorOrderRepository.sumPlatformRevenue());
		long totalProducts = productRepository.count();

		BigDecimal revenueThisMonth = nullToZero(vendorOrderRepository.sumPlatformRevenueBetween(monthStart, now));
		BigDecimal revenuePreviousMonth = nullToZero(vendorOrderRepository.sumPlatformRevenueBetween(previousMonthStart, monthStart));

		AdminDashboardStats stats = new AdminDashboardStats(
				totalUsers,
				activeVendors,
				pendingVendors,
				totalOrders,
				ordersThisWeek,
				platformRevenue,
				totalProducts,
				formatCountChange(ordersThisWeek, ordersPreviousWeek),
				formatRevenueChange(revenueThisMonth, revenuePreviousMonth));

		AdminDashboardCharts charts = new AdminDashboardCharts(
				buildRevenueByMonth(zonedNow.getYear()),
				buildOrdersByMonth(sixMonthsAgo),
				buildVendorStatusBreakdown());

		List<AdminPendingVendorItem> pendingVendorItems = vendorRepository
				.findAllByStatusOrderByCreatedAtAsc(VendorStatus.PENDING)
				.stream()
				.limit(8)
				.map(this::toPendingVendorItem)
				.toList();

		Map<Long, Double> ratingsByVendor = productReviewRepository.averageRatingByVendor().stream()
				.collect(Collectors.toMap(
						row -> ((Number) row[0]).longValue(),
						row -> ((Number) row[1]).doubleValue()));

		List<AdminTopVendorItem> topVendors = vendorOrderRepository
				.findTopVendorsByRevenue(4)
				.stream()
				.map(row -> toTopVendorItem(row, ratingsByVendor))
				.toList();

		List<AdminRecentActivityItem> recentActivity = buildRecentActivity();

		return new AdminDashboardResponse(stats, charts, pendingVendorItems, topVendors, recentActivity);
	}

	private AdminPendingVendorItem toPendingVendorItem(Vendor vendor) {
		return new AdminPendingVendorItem(
				vendor.getId(),
				vendor.getBusinessName(),
				vendor.getName(),
				extractCity(vendor.getBusinessLocation()),
				APPLIED_DATE_FORMAT.format(vendor.getCreatedAt()));
	}

	private AdminTopVendorItem toTopVendorItem(Object[] row, Map<Long, Double> ratingsByVendor) {
		long vendorId = ((Number) row[0]).longValue();
		String businessName = (String) row[1];
		long orderCount = ((Number) row[2]).longValue();
		BigDecimal revenue = toBigDecimal(row[3]);
		String profileImage = row[4] != null ? row[4].toString() : null;
		Double averageRating = ratingsByVendor.get(vendorId);
		return new AdminTopVendorItem(vendorId, businessName, profileImage, orderCount, revenue, averageRating);
	}

	private List<AdminChartMonthPoint> buildRevenueByMonth(int year) {
		Map<Integer, BigDecimal> revenueByMonth = new HashMap<>();
		for (Object[] row : vendorOrderRepository.sumRevenueGroupedByMonth(year)) {
			int month = ((Number) row[0]).intValue();
			revenueByMonth.put(month, toBigDecimal(row[1]));
		}

		List<AdminChartMonthPoint> points = new ArrayList<>();
		for (int month = 1; month <= 12; month++) {
			BigDecimal revenue = revenueByMonth.getOrDefault(month, BigDecimal.ZERO);
			double lakhs = revenue.divide(BigDecimal.valueOf(100_000), 2, RoundingMode.HALF_UP).doubleValue();
			points.add(new AdminChartMonthPoint(MONTH_LABELS[month - 1], lakhs));
		}
		return points;
	}

	private List<AdminChartMonthPoint> buildOrdersByMonth(Instant since) {
		List<AdminChartMonthPoint> points = new ArrayList<>();
		for (Object[] row : vendorOrderRepository.countOrdersGroupedByMonth(since)) {
			int month = ((Number) row[1]).intValue();
			long count = ((Number) row[2]).longValue();
			points.add(new AdminChartMonthPoint(MONTH_LABELS[month - 1], count));
		}
		return points;
	}

	private List<AdminVendorStatusSlice> buildVendorStatusBreakdown() {
		long approved = vendorRepository.countByStatus(VendorStatus.APPROVED);
		long pending = vendorRepository.countByStatus(VendorStatus.PENDING);
		long rejected = vendorRepository.countByStatus(VendorStatus.REJECTED);
		long closedStores = vendorRepository.countByStatusAndStoreStatus(VendorStatus.APPROVED, StoreStatus.CLOSED);

		return List.of(
				new AdminVendorStatusSlice("Approved", approved, "#059669"),
				new AdminVendorStatusSlice("Pending", pending, "#d97706"),
				new AdminVendorStatusSlice("Rejected", rejected, "#e11d48"),
				new AdminVendorStatusSlice("Store Closed", closedStores, "#64748b"));
	}

	private List<AdminRecentActivityItem> buildRecentActivity() {
		List<ActivityCandidate> candidates = new ArrayList<>();

		for (Vendor vendor : vendorRepository.findAllByStatusOrderByCreatedAtDesc(VendorStatus.PENDING).stream().limit(10).toList()) {
			candidates.add(new ActivityCandidate(
					vendor.getCreatedAt(),
					"Vendor application",
					vendor.getBusinessName() + " submitted documents",
					"text-teal-700 bg-teal-50"));
		}

		for (Vendor vendor : vendorRepository.findAllByStatusOrderByCreatedAtDesc(VendorStatus.APPROVED).stream().limit(10).toList()) {
			if (vendor.getDecidedAt() != null) {
				candidates.add(new ActivityCandidate(
						vendor.getDecidedAt(),
						"Vendor approved",
						vendor.getBusinessName() + " · " + extractCity(vendor.getBusinessLocation()),
						"text-emerald-700 bg-emerald-50"));
			}
		}

		for (VendorOrder order : vendorOrderRepository.findTop10ByOrderByCreatedAtDesc()) {
			BigDecimal lineTotal = order.getUnitPrice().multiply(BigDecimal.valueOf(order.getQuantity()));
			String detail = order.getStatus() == OrderStatus.DELIVERED
					? "Order #" + order.getId() + " · NPR " + formatNpr(lineTotal)
					: order.getProductName() + " · " + order.getStatus().name().toLowerCase(Locale.ENGLISH);
			String action = order.getStatus() == OrderStatus.DELIVERED ? "Order completed" : "New order";
			String tone = order.getStatus() == OrderStatus.DELIVERED
					? "text-violet-700 bg-violet-50"
					: "text-sky-700 bg-sky-50";
			candidates.add(new ActivityCandidate(order.getCreatedAt(), action, detail, tone));
		}

		for (ProductReview review : productReviewRepository.findTop10ByOrderByCreatedAtDesc(org.springframework.data.domain.PageRequest.of(0, 10))) {
			candidates.add(new ActivityCandidate(
					review.getCreatedAt(),
					"New review",
					review.getProduct().getProductName() + " · ★ " + review.getRating(),
					"text-amber-700 bg-amber-50"));
		}

		return candidates.stream()
				.sorted(Comparator.comparing(ActivityCandidate::occurredAt).reversed())
				.limit(5)
				.map(candidate -> new AdminRecentActivityItem(
						candidate.action(),
						candidate.detail(),
						candidate.occurredAt().toString(),
						candidate.tone()))
				.toList();
	}

	private String extractCity(String location) {
		if (location == null || location.isBlank()) {
			return "—";
		}
		String trimmed = location.trim();
		int comma = trimmed.indexOf(',');
		if (comma > 0) {
			return trimmed.substring(0, comma).trim();
		}
		return trimmed.length() > 40 ? trimmed.substring(0, 40) + "…" : trimmed;
	}

	private String formatCountChange(long current, long previous) {
		if (previous == 0) {
			return current > 0 ? "+" + current : "0";
		}
		long delta = current - previous;
		return delta >= 0 ? "+" + delta : String.valueOf(delta);
	}

	private String formatRevenueChange(BigDecimal current, BigDecimal previous) {
		if (previous == null || previous.compareTo(BigDecimal.ZERO) == 0) {
			return current != null && current.compareTo(BigDecimal.ZERO) > 0 ? "+100%" : "0%";
		}
		BigDecimal delta = current.subtract(previous);
		BigDecimal pct = delta.multiply(BigDecimal.valueOf(100)).divide(previous, 1, RoundingMode.HALF_UP);
		return (pct.signum() >= 0 ? "+" : "") + pct.toPlainString() + "%";
	}

	private BigDecimal nullToZero(BigDecimal value) {
		return value == null ? BigDecimal.ZERO : value;
	}

	private BigDecimal toBigDecimal(Object value) {
		if (value instanceof BigDecimal decimal) {
			return decimal;
		}
		if (value instanceof Number number) {
			return BigDecimal.valueOf(number.doubleValue());
		}
		return BigDecimal.ZERO;
	}

	private String formatNpr(BigDecimal amount) {
		return amount.setScale(0, RoundingMode.HALF_UP).toPlainString();
	}

	private record ActivityCandidate(Instant occurredAt, String action, String detail, String tone) {
	}
}
