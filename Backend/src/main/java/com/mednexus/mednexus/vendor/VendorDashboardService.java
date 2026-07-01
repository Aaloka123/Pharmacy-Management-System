package com.mednexus.mednexus.vendor;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.TextStyle;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.mednexus.mednexus.chat.MessageService;
import com.mednexus.mednexus.order.OrderStatus;
import com.mednexus.mednexus.order.PaymentMethod;
import com.mednexus.mednexus.order.VendorOrder;
import com.mednexus.mednexus.order.VendorOrderRepository;
import com.mednexus.mednexus.order.dto.VendorOrderResponse;
import com.mednexus.mednexus.product.ProductImageUtils;
import com.mednexus.mednexus.product.ProductRepository;
import com.mednexus.mednexus.product.ProductStatus;
import com.mednexus.mednexus.product.Product;
import com.mednexus.mednexus.product.ProductImageUtils;
import com.mednexus.mednexus.product.ProductRepository;
import com.mednexus.mednexus.review.ProductReviewRepository;
import com.mednexus.mednexus.security.PlatformUser;
import com.mednexus.mednexus.storage.MediaUrlUtils;
import com.mednexus.mednexus.user.Role;
import com.mednexus.mednexus.user.User;
import com.mednexus.mednexus.vendor.dto.VendorDashboardResponse;
import com.mednexus.mednexus.vendor.dto.VendorDashboardResponse.VendorChartPoint;
import com.mednexus.mednexus.vendor.dto.VendorDashboardResponse.VendorDashboardCharts;
import com.mednexus.mednexus.vendor.dto.VendorDashboardResponse.VendorDashboardStats;
import com.mednexus.mednexus.vendor.dto.VendorDashboardResponse.VendorPaymentSlice;
import com.mednexus.mednexus.vendor.dto.VendorDashboardResponse.VendorStatusSlice;
import com.mednexus.mednexus.vendor.dto.VendorDashboardResponse.VendorTopProductItem;

@Service
public class VendorDashboardService {

	private static final int LOW_STOCK_THRESHOLD = 10;
	private static final String[] MONTH_LABELS = {
			"Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
	};

	private final VendorOrderRepository vendorOrderRepository;
	private final ProductRepository productRepository;
	private final ProductReviewRepository productReviewRepository;
	private final MessageService messageService;

	public VendorDashboardService(
			VendorOrderRepository vendorOrderRepository,
			ProductRepository productRepository,
			ProductReviewRepository productReviewRepository,
			MessageService messageService) {
		this.vendorOrderRepository = vendorOrderRepository;
		this.productRepository = productRepository;
		this.productReviewRepository = productReviewRepository;
		this.messageService = messageService;
	}

	@Transactional(readOnly = true)
	public VendorDashboardResponse getDashboard(PlatformUser principal) {
		if (principal.getAppRole() != Role.VENDOR || !principal.isVendorAccount()) {
			throw new ResponseStatusException(HttpStatus.FORBIDDEN);
		}

		Long vendorId = principal.getSubjectId();
		Instant now = Instant.now();
		Instant weekStart = now.minus(7, ChronoUnit.DAYS);
		Instant previousWeekStart = now.minus(14, ChronoUnit.DAYS);
		ZonedDateTime zonedNow = ZonedDateTime.now(ZoneOffset.UTC);
		Instant monthStart = zonedNow.withDayOfMonth(1).truncatedTo(ChronoUnit.DAYS).toInstant();
		Instant previousMonthStart = zonedNow.minusMonths(1).withDayOfMonth(1).truncatedTo(ChronoUnit.DAYS).toInstant();

		BigDecimal totalRevenue = nullToZero(vendorOrderRepository.sumRevenueByVendor(vendorId));
		BigDecimal revenueThisMonth = nullToZero(vendorOrderRepository.sumRevenueByVendorBetween(vendorId, monthStart, now));
		BigDecimal revenuePreviousMonth = nullToZero(
				vendorOrderRepository.sumRevenueByVendorBetween(vendorId, previousMonthStart, monthStart));

		long totalOrders = vendorOrderRepository.countByVendorIdAndStatusNot(vendorId, OrderStatus.CANCELED);
		long ordersThisWeek = vendorOrderRepository.countByVendorIdAndCreatedAtGreaterThanEqual(vendorId, weekStart);
		long ordersPreviousWeek = vendorOrderRepository.countByVendorIdAndCreatedAtGreaterThanEqualAndCreatedAtLessThan(
				vendorId, previousWeekStart, weekStart);

		long activeProducts = productRepository.countByVendorIdAndStatus(vendorId, ProductStatus.ACTIVE);
		long lowStockCount = productRepository.countByVendorIdAndStatusAndStockLessThanEqual(
				vendorId, ProductStatus.ACTIVE, LOW_STOCK_THRESHOLD);

		Double averageRating = null;
		long totalReviews = 0;
		Object[] ratingRow = productReviewRepository.averageRatingAndCountForVendor(vendorId);
		if (ratingRow != null && ratingRow.length >= 2) {
			if (ratingRow[0] != null) {
				averageRating = ((Number) ratingRow[0]).doubleValue();
			}
			if (ratingRow[1] != null) {
				totalReviews = ((Number) ratingRow[1]).longValue();
			}
		}

		VendorDashboardStats stats = new VendorDashboardStats(
				totalRevenue,
				formatRevenueChange(revenueThisMonth, revenuePreviousMonth),
				totalOrders,
				ordersThisWeek,
				formatCountChange(ordersThisWeek, ordersPreviousWeek),
				activeProducts,
				lowStockCount,
				averageRating,
				totalReviews);

		VendorDashboardCharts charts = new VendorDashboardCharts(
				buildRevenueByMonth(vendorId, zonedNow.getYear()),
				buildOrdersByDay(vendorId, weekStart),
				buildOrderStatusBreakdown(vendorId),
				buildPaymentMethodSplit(vendorId),
				buildTopSellingDayLabel(vendorId, weekStart));

		List<VendorOrderResponse> recentOrders = vendorOrderRepository
				.findRecentByVendorId(vendorId, PageRequest.of(0, 5))
				.stream()
				.map(this::toOrderResponse)
				.toList();

		List<VendorTopProductItem> topProducts = vendorOrderRepository
				.findTopProductsByVendor(vendorId, 4)
				.stream()
				.map(row -> toTopProductItem(row, vendorId))
				.toList();

		long unreadMessages = messageService.countUnread(principal);

		return new VendorDashboardResponse(stats, charts, recentOrders, topProducts, unreadMessages);
	}

	private VendorTopProductItem toTopProductItem(Object[] row, Long vendorId) {
		long productId = ((Number) row[0]).longValue();
		String name = (String) row[1];
		long sold = ((Number) row[2]).longValue();
		BigDecimal revenue = toBigDecimal(row[3]);
		String snapshotImage = row.length > 4 && row[4] != null ? row[4].toString() : null;
		String imageUrl = productRepository.findByIdAndVendorId(productId, vendorId)
				.map(product -> ProductImageUtils.resolveOrderProductImage(snapshotImage, product))
				.orElseGet(() -> MediaUrlUtils.normalizeStoredUrl(snapshotImage));
		return new VendorTopProductItem(productId, name, sold, revenue, imageUrl);
	}

	private VendorOrderResponse toOrderResponse(VendorOrder order) {
		User user = order.getUser();
		String location = user.getLocation();
		if (location == null || location.isBlank()) {
			location = "Not provided";
		}
		return new VendorOrderResponse(
				order.getId(),
				order.getProduct().getId(),
				user.getFullName(),
				user.getEmail(),
				user.getPhoneNumber(),
				location,
				order.getVendor().getBusinessName(),
				order.getProductName(),
				order.getProductSku(),
				ProductImageUtils.resolveOrderProductImage(order.getProductImage(), order.getProduct()),
				order.getUnitPrice(),
				order.getQuantity(),
				order.getPaymentMethod(),
				order.getCreatedAt(),
				order.getStatus());
	}

	private List<VendorChartPoint> buildRevenueByMonth(Long vendorId, int year) {
		Map<Integer, BigDecimal> revenueByMonth = new HashMap<>();
		for (Object[] row : vendorOrderRepository.sumRevenueGroupedByMonthForVendor(vendorId, year)) {
			int month = ((Number) row[0]).intValue();
			revenueByMonth.put(month, toBigDecimal(row[1]));
		}

		List<VendorChartPoint> points = new ArrayList<>();
		for (int month = 1; month <= 12; month++) {
			BigDecimal revenue = revenueByMonth.getOrDefault(month, BigDecimal.ZERO);
			double thousands = revenue.divide(BigDecimal.valueOf(1_000), 2, RoundingMode.HALF_UP).doubleValue();
			points.add(new VendorChartPoint(MONTH_LABELS[month - 1], thousands));
		}
		return points;
	}

	private List<VendorChartPoint> buildOrdersByDay(Long vendorId, Instant weekStart) {
		Map<LocalDate, Long> countsByDate = new HashMap<>();
		for (Object[] row : vendorOrderRepository.countOrdersGroupedByDayForVendor(vendorId, weekStart)) {
			LocalDate date;
			Object dateValue = row[0];
			if (dateValue instanceof java.sql.Date sqlDate) {
				date = sqlDate.toLocalDate();
			} else if (dateValue instanceof LocalDate localDate) {
				date = localDate;
			} else {
				date = LocalDate.parse(dateValue.toString());
			}
			countsByDate.put(date, ((Number) row[1]).longValue());
		}

		List<VendorChartPoint> points = new ArrayList<>();
		LocalDate today = LocalDate.now(ZoneOffset.UTC);
		for (int offset = 6; offset >= 0; offset--) {
			LocalDate date = today.minusDays(offset);
			String label = date.getDayOfWeek().getDisplayName(TextStyle.SHORT, Locale.ENGLISH);
			long count = countsByDate.getOrDefault(date, 0L);
			points.add(new VendorChartPoint(label, count));
		}
		return points;
	}

	private List<VendorStatusSlice> buildOrderStatusBreakdown(Long vendorId) {
		Map<OrderStatus, Long> counts = new LinkedHashMap<>();
		for (OrderStatus status : OrderStatus.values()) {
			counts.put(status, 0L);
		}
		for (Object[] row : vendorOrderRepository.countOrdersByStatusForVendor(vendorId)) {
			OrderStatus status = OrderStatus.valueOf(row[0].toString());
			counts.put(status, ((Number) row[1]).longValue());
		}

		return List.of(
				new VendorStatusSlice("Delivered", counts.get(OrderStatus.DELIVERED), "#059669"),
				new VendorStatusSlice("Shipped", counts.get(OrderStatus.SHIPPED), "#0284c7"),
				new VendorStatusSlice("Confirmed", counts.get(OrderStatus.CONFIRMED), "#6366f1"),
				new VendorStatusSlice("Pending", counts.get(OrderStatus.PENDING), "#d97706"),
				new VendorStatusSlice("Canceled", counts.get(OrderStatus.CANCELED), "#e11d48"));
	}

	private List<VendorPaymentSlice> buildPaymentMethodSplit(Long vendorId) {
		Map<PaymentMethod, Long> counts = new HashMap<>();
		long total = 0;
		for (Object[] row : vendorOrderRepository.countOrdersByPaymentMethodForVendor(vendorId)) {
			PaymentMethod method = PaymentMethod.valueOf(row[0].toString());
			long count = ((Number) row[1]).longValue();
			counts.put(method, count);
			total += count;
		}

		if (total == 0) {
			return List.of(
					new VendorPaymentSlice("eSewa", 0),
					new VendorPaymentSlice("Khalti", 0),
					new VendorPaymentSlice("COD", 0));
		}

		return List.of(
				paymentSlice("eSewa", counts.getOrDefault(PaymentMethod.ESEWA, 0L), total),
				paymentSlice("Khalti", counts.getOrDefault(PaymentMethod.KHALTI, 0L), total),
				paymentSlice("COD", counts.getOrDefault(PaymentMethod.COD, 0L), total));
	}

	private VendorPaymentSlice paymentSlice(String label, long count, long total) {
		int pct = Math.toIntExact(Math.round(count * 100.0 / total));
		return new VendorPaymentSlice(label, pct);
	}

	private String buildTopSellingDayLabel(Long vendorId, Instant weekStart) {
		List<VendorChartPoint> days = buildOrdersByDay(vendorId, weekStart);
		VendorChartPoint top = days.stream()
				.max((left, right) -> Double.compare(left.value(), right.value()))
				.orElse(new VendorChartPoint("—", 0));
		if (top.value() <= 0) {
			return "No orders this week yet";
		}
		long orders = Math.round(top.value());
		return top.label() + " · " + orders + " order" + (orders == 1 ? "" : "s");
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
}
