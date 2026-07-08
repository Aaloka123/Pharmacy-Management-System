package com.mednexus.mednexus.admin;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mednexus.mednexus.admin.dto.AdminProductProfitItem;
import com.mednexus.mednexus.admin.dto.AdminProfitResponse;
import com.mednexus.mednexus.order.VendorOrderRepository;
import com.mednexus.mednexus.product.ProductImageUtils;
import com.mednexus.mednexus.storage.MediaUrlUtils;

@Service
public class AdminProfitService {

	private static final BigDecimal ADMIN_COMMISSION_RATE = new BigDecimal("0.20");

	private final VendorOrderRepository vendorOrderRepository;

	@Autowired
	public AdminProfitService(VendorOrderRepository vendorOrderRepository) {
		this.vendorOrderRepository = vendorOrderRepository;
	}

	@Transactional(readOnly = true)
	public AdminProfitResponse listProductProfit(Integer year, Integer month, boolean allHistory) {
		List<Object[]> rows;
		String periodLabel;

		if (allHistory) {
			rows = vendorOrderRepository.findProductProfitSummaryAll();
			periodLabel = "All history";
		} else {
			ZoneId zone = ZoneId.systemDefault();
			ZonedDateTime now = ZonedDateTime.now(zone);
			int targetYear = year != null ? year : now.getYear();
			int targetMonth = month != null ? month : now.getMonthValue();
			if (targetMonth < 1 || targetMonth > 12) {
				throw new IllegalArgumentException("month must be between 1 and 12");
			}

			ZonedDateTime monthStart = ZonedDateTime.of(targetYear, targetMonth, 1, 0, 0, 0, 0, zone);
			ZonedDateTime nextMonthStart = monthStart.plusMonths(1);
			if (monthStart.isAfter(now)) {
				throw new IllegalArgumentException("Cannot view profit for a future month");
			}

			rows = vendorOrderRepository.findProductProfitSummaryBetween(
					monthStart.toInstant(),
					nextMonthStart.toInstant());
			periodLabel = monthStart.format(DateTimeFormatter.ofPattern("MMMM yyyy"));
		}

		List<AdminProductProfitItem> products = new ArrayList<>();
		BigDecimal totalAdminProfit = BigDecimal.ZERO;

		for (Object[] row : rows) {
			Long productId = ((Number) row[0]).longValue();
			String productName = (String) row[1];
			String productSku = row[2] != null ? row[2].toString() : "";
			Long vendorId = ((Number) row[3]).longValue();
			String vendorBusinessName = (String) row[4];
			String productImage = ProductImageUtils.resolveOrderProductImage(
					row[5] != null ? row[5].toString() : null,
					null);
			BigDecimal unitPrice = toBigDecimal(row[6]);
			long quantitySold = ((Number) row[7]).longValue();
			BigDecimal totalSales = toBigDecimal(row[8]).setScale(2, RoundingMode.HALF_UP);
			Instant firstSoldAt = toInstant(row[9]);

			BigDecimal adminProfit = totalSales.multiply(ADMIN_COMMISSION_RATE)
					.setScale(2, RoundingMode.HALF_UP);
			totalAdminProfit = totalAdminProfit.add(adminProfit);

			if (productImage != null) {
				productImage = MediaUrlUtils.normalizeStoredUrl(productImage);
			}

			products.add(new AdminProductProfitItem(
					productId,
					productName,
					productSku,
					productImage,
					vendorId,
					vendorBusinessName,
					unitPrice,
					quantitySold,
					totalSales,
					adminProfit,
					firstSoldAt));
		}

		return new AdminProfitResponse(
				totalAdminProfit.setScale(2, RoundingMode.HALF_UP),
				periodLabel,
				products);
	}

	private static BigDecimal toBigDecimal(Object value) {
		if (value == null) {
			return BigDecimal.ZERO;
		}
		if (value instanceof BigDecimal decimal) {
			return decimal;
		}
		return new BigDecimal(value.toString());
	}

	private static Instant toInstant(Object value) {
		if (value == null) {
			return null;
		}
		if (value instanceof Instant instant) {
			return instant;
		}
		if (value instanceof Timestamp timestamp) {
			return timestamp.toInstant();
		}
		if (value instanceof java.util.Date date) {
			return date.toInstant();
		}
		if (value instanceof LocalDateTime localDateTime) {
			return localDateTime.atZone(ZoneId.systemDefault()).toInstant();
		}
		String text = value.toString().trim();
		if (text.isEmpty()) {
			return null;
		}
		try {
			return Instant.parse(text);
		} catch (DateTimeParseException ignored) {
			return LocalDateTime.parse(text).atZone(ZoneId.systemDefault()).toInstant();
		}
	}
}
