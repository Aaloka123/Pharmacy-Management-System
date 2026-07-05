package com.mednexus.mednexus.chatbot;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.mednexus.mednexus.chatbot.dto.ChatbotProductCard;
import com.mednexus.mednexus.order.OrderStatus;
import com.mednexus.mednexus.order.VendorOrder;
import com.mednexus.mednexus.order.VendorOrderRepository;
import com.mednexus.mednexus.product.Product;
import com.mednexus.mednexus.product.ProductExpiryUtils;
import com.mednexus.mednexus.product.ProductImageUtils;
import com.mednexus.mednexus.product.ProductRepository;
import com.mednexus.mednexus.product.ProductStatus;
import com.mednexus.mednexus.review.ProductReview;
import com.mednexus.mednexus.review.ProductReviewRepository;
import com.mednexus.mednexus.review.ReviewReplyRepository;
import com.mednexus.mednexus.vendor.StoreStatus;
import com.mednexus.mednexus.vendor.VendorStatus;

@Service
public class ChatbotContextService {

	private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd");
	private static final int MAX_PRODUCTS = 6;
	private static final int MAX_ORDERS = 8;
	private static final int MAX_REVIEWS = 6;

	private final ProductRepository productRepository;
	private final VendorOrderRepository vendorOrderRepository;
	private final ProductReviewRepository productReviewRepository;
	private final ReviewReplyRepository reviewReplyRepository;

	public ChatbotContextService(
			ProductRepository productRepository,
			VendorOrderRepository vendorOrderRepository,
			ProductReviewRepository productReviewRepository,
			ReviewReplyRepository reviewReplyRepository) {
		this.productRepository = productRepository;
		this.vendorOrderRepository = vendorOrderRepository;
		this.productReviewRepository = productReviewRepository;
		this.reviewReplyRepository = reviewReplyRepository;
	}

	@Transactional(readOnly = true)
	public List<ChatbotProductCard> findMatchingProducts(String message) {
		if (message == null || message.isBlank()) {
			return List.of();
		}
		String normalized = message.toLowerCase(Locale.ROOT);
		List<Product> catalog = productRepository.findCatalog(
				VendorStatus.APPROVED, StoreStatus.OPEN, ProductStatus.ACTIVE, null);

		LinkedHashSet<Product> matches = new LinkedHashSet<>();
		for (Product product : catalog) {
			if (matchesProduct(normalized, product)) {
				matches.add(product);
			}
		}

		if (matches.isEmpty() && looksLikeProductQuestion(normalized)) {
			for (String token : extractSearchTokens(normalized)) {
				for (Product product : catalog) {
					if (productNameContainsToken(product, token)) {
						matches.add(product);
					}
				}
			}
		}

		return matches.stream()
				.limit(MAX_PRODUCTS)
				.map(this::toProductCard)
				.toList();
	}

	@Transactional(readOnly = true)
	public String buildProductContext(List<ChatbotProductCard> products) {
		if (products == null || products.isEmpty()) {
			return "No matching MedNexus catalog products were found for this message.";
		}
		StringBuilder builder = new StringBuilder("Matching MedNexus catalog products:\n");
		for (ChatbotProductCard product : products) {
			builder.append("- ")
					.append(product.productName())
					.append(" (ID ")
					.append(product.id())
					.append(") — Rs. ")
					.append(product.price())
					.append(", stock: ")
					.append(product.stock())
					.append(", vendor: ")
					.append(product.vendorBusinessName())
					.append(", category: ")
					.append(product.category())
					.append('\n');
		}
		builder.append(
				"Only mention products from this list. If the user asks whether you have a medicine, confirm availability using this data.");
		return builder.toString();
	}

	@Transactional(readOnly = true)
	public String buildVendorContext(Long vendorId) {
		List<VendorOrder> orders = vendorOrderRepository.findByVendorIdWithDetails(vendorId);
		List<Product> products = productRepository.findByVendorIdOrderByCreatedAtDesc(vendorId);
		List<ProductReview> reviews = productReviewRepository.findByVendorIdWithDetails(vendorId);

		long pendingOrders = orders.stream().filter(order -> order.getStatus() == OrderStatus.PENDING).count();
		long confirmedOrders = orders.stream().filter(order -> order.getStatus() == OrderStatus.CONFIRMED).count();
		long shippedOrders = orders.stream().filter(order -> order.getStatus() == OrderStatus.SHIPPED).count();

		List<Product> expiredProducts = products.stream()
				.filter(product -> ProductExpiryUtils.isExpired(product.getExpiryDate())
						|| product.getStatus() == ProductStatus.INACTIVE)
				.sorted(Comparator.comparing(Product::getExpiryDate, Comparator.nullsLast(Comparator.naturalOrder())))
				.limit(8)
				.toList();

		List<Product> outOfStock = products.stream()
				.filter(product -> product.getStatus() == ProductStatus.ACTIVE && product.getStock() <= 0)
				.limit(8)
				.toList();

		List<ProductReview> unrepliedReviews = reviews.stream()
				.filter(review -> reviewReplyRepository.findByReviewId(review.getId()).isEmpty())
				.sorted(Comparator.comparing(ProductReview::getCreatedAt).reversed())
				.limit(MAX_REVIEWS)
				.toList();

		StringBuilder builder = new StringBuilder();
		builder.append("Vendor business snapshot:\n");
		builder.append("- Pending orders: ").append(pendingOrders).append('\n');
		builder.append("- Confirmed orders: ").append(confirmedOrders).append('\n');
		builder.append("- Shipped orders: ").append(shippedOrders).append('\n');
		builder.append("- Total orders loaded: ").append(orders.size()).append('\n');
		builder.append("- Expired/inactive products: ").append(expiredProducts.size()).append('\n');
		builder.append("- Out-of-stock active products: ").append(outOfStock.size()).append('\n');
		builder.append("- Reviews without vendor reply: ").append(unrepliedReviews.size()).append('\n');

		builder.append("\nRecent orders:\n");
		if (orders.isEmpty()) {
			builder.append("- None\n");
		} else {
			orders.stream()
					.sorted(Comparator.comparing(VendorOrder::getCreatedAt).reversed())
					.limit(MAX_ORDERS)
					.forEach(order -> builder.append("- Order #")
							.append(order.getId())
							.append(" | ")
							.append(order.getProductName())
							.append(" | qty ")
							.append(order.getQuantity())
							.append(" | status ")
							.append(order.getStatus())
							.append(" | customer ")
							.append(order.getUser().getFullName())
							.append('\n'));
		}

		builder.append("\nExpired or inactive products:\n");
		if (expiredProducts.isEmpty()) {
			builder.append("- None\n");
		} else {
			for (Product product : expiredProducts) {
				builder.append("- ")
						.append(product.getProductName())
						.append(" | expiry ")
						.append(formatDate(product.getExpiryDate()))
						.append(" | status ")
						.append(product.getStatus())
						.append(" | stock ")
						.append(product.getStock())
						.append('\n');
			}
		}

		builder.append("\nOut-of-stock products:\n");
		if (outOfStock.isEmpty()) {
			builder.append("- None\n");
		} else {
			for (Product product : outOfStock) {
				builder.append("- ")
						.append(product.getProductName())
						.append(" | stock ")
						.append(product.getStock())
						.append('\n');
			}
		}

		builder.append("\nRecent reviews needing attention:\n");
		if (unrepliedReviews.isEmpty()) {
			builder.append("- None\n");
		} else {
			for (ProductReview review : unrepliedReviews) {
				builder.append("- Review #")
						.append(review.getId())
						.append(" | product ")
						.append(review.getProduct().getProductName())
						.append(" | rating ")
						.append(review.getRating())
						.append("/5 | ")
						.append(trim(review.getBody(), 120))
						.append('\n');
			}
		}

		builder.append(
				"\nAnswer using only this vendor data. If the vendor asks about orders, expiry, stock, or reviews, summarize clearly and suggest practical next steps.");
		return builder.toString();
	}

	public String serializeProductIds(List<ChatbotProductCard> products) {
		if (products == null || products.isEmpty()) {
			return null;
		}
		return products.stream()
				.map(product -> String.valueOf(product.id()))
				.reduce((left, right) -> left + "," + right)
				.orElse(null);
	}

	@Transactional(readOnly = true)
	public List<ChatbotProductCard> loadProductCards(String storedProductIds) {
		if (storedProductIds == null || storedProductIds.isBlank()) {
			return List.of();
		}
		List<Long> ids = java.util.Arrays.stream(storedProductIds.split(","))
				.map(String::trim)
				.filter(value -> !value.isEmpty())
				.map(Long::valueOf)
				.toList();
		if (ids.isEmpty()) {
			return List.of();
		}
		return productRepository.findAllById(ids).stream()
				.map(this::toProductCard)
				.toList();
	}

	private ChatbotProductCard toProductCard(Product product) {
		return new ChatbotProductCard(
				product.getId(),
				product.getProductName(),
				product.getVendor().getBusinessName(),
				product.getPrice(),
				product.getStock(),
				product.getCategory(),
				ProductImageUtils.preferredImageUrl(product));
	}

	private static boolean looksLikeProductQuestion(String message) {
		return containsAny(message,
				"do you have",
				"do u have",
				"have you got",
				"available",
				"in stock",
				"stock",
				"medicine",
				"medication",
				"tablet",
				"capsule",
				"syrup",
				"buy",
				"sell",
				"paracetamol",
				"ibuprofen",
				"cetirizine");
	}

	private static boolean matchesProduct(String message, Product product) {
		String name = product.getProductName().toLowerCase(Locale.ROOT);
		if (message.contains(name)) {
			return true;
		}
		for (String part : name.split("[\\s\\-/]+")) {
			if (part.length() >= 4 && message.contains(part)) {
				return true;
			}
		}
		for (String token : extractSearchTokens(message)) {
			if (token.length() >= 4 && name.contains(token)) {
				return true;
			}
			if (productNameContainsToken(product, token)) {
				return true;
			}
		}
		return false;
	}

	private static boolean productNameContainsToken(Product product, String token) {
		if (token.length() < 3) {
			return false;
		}
		String name = product.getProductName().toLowerCase(Locale.ROOT);
		String category = product.getCategory() == null ? "" : product.getCategory().toLowerCase(Locale.ROOT);
		String strength = product.getStrength() == null ? "" : product.getStrength().toLowerCase(Locale.ROOT);
		return name.contains(token) || category.contains(token) || strength.contains(token);
	}

	private static List<String> extractSearchTokens(String message) {
		Set<String> stopWords = Set.of(
				"about", "after", "again", "also", "have", "with", "what", "when", "where", "which", "would",
				"could", "should", "there", "their", "this", "that", "from", "your", "mine", "pain", "head",
				"help", "need", "want", "like", "just", "very", "much", "some", "any", "does", "medicine");
		List<String> tokens = new ArrayList<>();
		for (String raw : message.split("[^a-z0-9]+")) {
			String token = raw.trim();
			if (token.length() < 3 || stopWords.contains(token)) {
				continue;
			}
			tokens.add(token);
		}
		return tokens;
	}

	private static boolean containsAny(String message, String... needles) {
		for (String needle : needles) {
			if (message.contains(needle)) {
				return true;
			}
		}
		return false;
	}

	private static String formatDate(LocalDate date) {
		return date == null ? "n/a" : DATE_FORMAT.format(date);
	}

	private static String trim(String value, int maxLength) {
		if (value == null || value.isBlank()) {
			return "";
		}
		String trimmed = value.trim().replaceAll("\\s+", " ");
		return trimmed.length() <= maxLength ? trimmed : trimmed.substring(0, maxLength - 3) + "...";
	}
}
