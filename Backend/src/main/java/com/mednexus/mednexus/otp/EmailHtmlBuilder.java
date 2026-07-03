package com.mednexus.mednexus.otp;

import java.math.BigDecimal;
import java.text.DecimalFormat;
import java.util.List;

import com.mednexus.mednexus.order.OrderStatus;
import com.mednexus.mednexus.order.dto.OrderEmailDetails;
import com.mednexus.mednexus.order.dto.OrderEmailLineItem;

final class EmailHtmlBuilder {

	private static final String BRAND = "MedNexus";
	private static final String TEAL = "#0f766e";
	private static final String TEAL_LIGHT = "#f0fdfa";
	private static final String SLATE = "#334155";
	private static final String MUTED = "#64748b";

	private EmailHtmlBuilder() {
	}

	static String welcomeUser(String greetingName, String frontendUrl, String logoUrl) {
		String safeName = escape(greetingName);
		String safeUrl = escape(frontendUrl);
		return layout(
				"""
				<h1 style="margin:0 0 12px;font-size:24px;line-height:1.3;color:#0f172a;font-weight:700;">Welcome to %s</h1>
				<p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:%s;">Hello <strong>%s</strong>,</p>
				<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:%s;">
				  Thank you for joining %s. Your account is ready — you can browse trusted pharmacies, order medicines, and track deliveries in one place.
				</p>
				<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:28px 0;">
				  <tr>
				    <td style="border-radius:10px;background:%s;">
				      <a href="%s" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Start shopping</a>
				    </td>
				  </tr>
				</table>
				<p style="margin:0;font-size:14px;line-height:1.6;color:%s;">
				  If you did not create this account, you can safely ignore this email.
				</p>
				"""
						.formatted(BRAND, SLATE, safeName, SLATE, BRAND, TEAL, safeUrl, MUTED),
				"Welcome to " + BRAND,
				logoUrl,
				frontendUrl);
	}

	static String otpVerification(String headline, String intro, String code, int ttlMinutes, String logoUrl, String frontendUrl) {
		String safeHeadline = escape(headline);
		String safeIntro = escape(intro);
		String safeCode = escape(code);
		return layout(
				"""
				<h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#0f172a;font-weight:700;">%s</h1>
				<p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:%s;">%s</p>
				<table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;">
				  <tr>
				    <td align="center" style="padding:24px 16px;border-radius:12px;background:%s;border:1px solid #99f6e4;">
				      <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:%s;">Verification code</p>
				      <p style="margin:0;font-size:34px;line-height:1;font-weight:700;letter-spacing:0.35em;color:%s;font-family:Consolas,'Courier New',monospace;">%s</p>
				    </td>
				  </tr>
				</table>
				<p style="margin:0 0 12px;font-size:14px;line-height:1.6;color:%s;">
				  This code expires in <strong>%d minutes</strong>. Enter it on the %s website to continue.
				</p>
				<p style="margin:0;font-size:14px;line-height:1.6;color:%s;">
				  For your security, never share this code with anyone. %s will never ask for it by phone or message.
				</p>
				"""
						.formatted(
								safeHeadline,
								SLATE,
								safeIntro,
								TEAL_LIGHT,
								TEAL,
								TEAL,
								safeCode,
								MUTED,
								ttlMinutes,
								BRAND,
								MUTED,
								BRAND),
				headline,
				logoUrl,
				frontendUrl);
	}

	static String vendorPendingApproval(String greetingName, String businessName, String logoUrl, String frontendUrl) {
		String safeName = escape(greetingName);
		String safeBusiness = escape(businessName);
		return layout(
				"""
				%s
				<h1 style="margin:0 0 10px;font-size:26px;line-height:1.25;color:#0f172a;font-weight:700;">Application is under review</h1>
				<p style="margin:0 0 22px;font-size:15px;line-height:1.7;color:%s;">Hello <strong>%s</strong>, thank you for applying to partner with %s.</p>
				%s
				<table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;">
				  <tr>
				    <td style="padding:20px 22px;border-radius:12px;background:#fffbeb;border:1px solid #fde68a;">
				      <p style="margin:0 0 14px;font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#b45309;">What happens next</p>
				      %s
				      %s
				      %s
				    </td>
				  </tr>
				</table>
				<p style="margin:0 0 8px;font-size:14px;line-height:1.65;color:%s;">
				  We will email you again once the review is complete. No action is needed from you right now.
				</p>
				<p style="margin:0;font-size:14px;line-height:1.65;color:%s;">Thank you for choosing %s.</p>
				"""
						.formatted(
								statusBanner("Under review", "#fffbeb", "#b45309", "#fde68a"),
								SLATE,
								safeName,
								BRAND,
								businessCard(safeBusiness),
								stepRow("1", "Our admin team verifies your certificates and business details."),
								stepRow("2", "We confirm your pharmacy license and registration information."),
								stepRow("3", "You receive an approval or update email within a few business days."),
								MUTED,
								MUTED,
								BRAND),
				"Your MedNexus vendor application is under review",
				logoUrl,
				frontendUrl);
	}

	static String vendorApprovedWelcome(String greetingName, String businessName, String frontendUrl, String logoUrl) {
		String safeName = escape(greetingName);
		String safeBusiness = escape(businessName);
		String safeUrl = escape(frontendUrl);
		String loginUrl = safeUrl + "/vendorlogin";
		return layout(
				"""
				%s
				<h1 style="margin:0 0 10px;font-size:26px;line-height:1.25;color:#0f172a;font-weight:700;">Welcome to %s!</h1>
				<p style="margin:0 0 22px;font-size:15px;line-height:1.7;color:%s;">Hello <strong>%s</strong>, your vendor application has been <strong style="color:#047857;">approved</strong>.</p>
				%s
				<table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;">
				  <tr>
				    <td style="padding:20px 22px;border-radius:12px;background:%s;border:1px solid #a7f3d0;">
				      <p style="margin:0 0 12px;font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:#047857;">You can now</p>
				      %s
				      %s
				      %s
				    </td>
				  </tr>
				</table>
				%s
				<p style="margin:0;font-size:14px;line-height:1.65;color:%s;">We are excited to partner with you and help grow your online pharmacy presence.</p>
				"""
						.formatted(
								statusBanner("Approved", TEAL_LIGHT, TEAL, "#99f6e4"),
								BRAND,
								SLATE,
								safeName,
								businessCard(safeBusiness),
								TEAL_LIGHT,
								bulletRow("Add and manage your product catalog"),
								bulletRow("Receive and track customer orders"),
								bulletRow("Update store details and certificates anytime"),
								ctaButton(loginUrl, "Go to vendor portal", TEAL),
								MUTED),
				"Welcome to the " + BRAND + " vendor portal",
				logoUrl,
				frontendUrl);
	}

	static String vendorRejectedApplication(String greetingName, String businessName, String logoUrl, String frontendUrl) {
		String safeName = escape(greetingName);
		String safeBusiness = escape(businessName);
		String safeUrl = escape(frontendUrl);
		String signupUrl = safeUrl + "/vendorsignup";
		return layout(
				"""
				%s
				<h1 style="margin:0 0 10px;font-size:26px;line-height:1.25;color:#0f172a;font-weight:700;">Application not approved</h1>
				<p style="margin:0 0 22px;font-size:15px;line-height:1.7;color:%s;">Hello <strong>%s</strong>, thank you for your interest in partnering with %s.</p>
				%s
				<table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;">
				  <tr>
				    <td style="padding:20px 22px;border-radius:12px;background:#fff1f2;border:1px solid #fecdd3;">
				      <p style="margin:0 0 10px;font-size:15px;line-height:1.65;font-weight:600;color:#9f1239;">Your application could not be approved at this time.</p>
				      <p style="margin:0;font-size:14px;line-height:1.65;color:#be123c;">
				        This may be due to incomplete documents, unclear certificate details, or information that could not be verified. You may submit a new application with updated documents if you wish to apply again.
				      </p>
				    </td>
				  </tr>
				</table>
				%s
				<p style="margin:0;font-size:14px;line-height:1.65;color:%s;">If you believe this decision was made in error, please contact our support team through the website.</p>
				"""
						.formatted(
								statusBanner("Not approved", "#fff1f2", "#be123c", "#fecdd3"),
								SLATE,
								safeName,
								BRAND,
								businessCard(safeBusiness),
								ctaButton(signupUrl, "Submit a new application", "#be123c"),
								MUTED),
				"Update on your MedNexus vendor application",
				logoUrl,
				frontendUrl);
	}

	static String storeStatusChange(
			String greetingName,
			String businessName,
			boolean storeOpen,
			boolean changedByAdmin,
			String logoUrl,
			String frontendUrl) {
		String safeName = escape(greetingName);
		String safeBusiness = escape(businessName);
		String vendorPortalUrl = escape(frontendUrl + "/vendordashboard");
		String bannerLabel = storeOpen ? "Store open" : "Store temporarily closed";
		String bannerBg = storeOpen ? TEAL_LIGHT : "#fff7ed";
		String bannerText = storeOpen ? TEAL : "#c2410c";
		String bannerBorder = storeOpen ? "#99f6e4" : "#fed7aa";
		String headline = storeOpen ? "Your store is now open" : "Your store has been temporarily closed";
		String body;
		if (storeOpen) {
			body = changedByAdmin
					? "An administrator has reopened your store on %s. Customers can browse your products and place orders again."
					: "Your store status on %s is now set to open. Customers can browse your products and place orders.";
		} else {
			body = changedByAdmin
					? "An administrator has temporarily closed your store on %s. Customers will not be able to place new orders until your store is reopened by an administrator."
					: "You have temporarily closed your store on %s. Customers will not be able to place new orders until you reopen your store from the vendor portal.";
		}
		String safeBody = escape(body.formatted(BRAND));
		return layout(
				"""
				%s
				<h1 style="margin:0 0 10px;font-size:26px;line-height:1.25;color:#0f172a;font-weight:700;">%s</h1>
				<p style="margin:0 0 22px;font-size:15px;line-height:1.7;color:%s;">Hello <strong>%s</strong>,</p>
				%s
				<p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:%s;">%s</p>
				%s
				<p style="margin:0;font-size:14px;line-height:1.65;color:%s;">Manage your store anytime from the vendor portal.</p>
				"""
						.formatted(
								statusBanner(bannerLabel, bannerBg, bannerText, bannerBorder),
								escape(headline),
								SLATE,
								safeName,
								businessCard(safeBusiness),
								SLATE,
								safeBody,
								ctaButton(vendorPortalUrl, "Go to vendor portal", TEAL),
								MUTED),
				headline,
				logoUrl,
				frontendUrl);
	}

	static String contactMessageAdmin(
			String fullName,
			String email,
			String phone,
			String message,
			String logoUrl,
			String frontendUrl) {
		String safeName = escape(fullName);
		String safeEmail = escape(email);
		String safePhone = escape(phone);
		String safeMessage = escape(message);
		return layout(
				"""
				<h1 style="margin:0 0 12px;font-size:24px;line-height:1.3;color:#0f172a;font-weight:700;">New contact message</h1>
				<p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:%s;">Someone submitted the contact form on the %s website.</p>
				%s
				<p style="margin:20px 0 0;font-size:14px;line-height:1.65;color:%s;">Reply directly to this email to respond to the sender.</p>
				"""
						.formatted(SLATE, BRAND, contactDetailsTable(safeName, safeEmail, safePhone, safeMessage), MUTED),
				"New contact message from " + fullName,
				logoUrl,
				frontendUrl);
	}

	private static String contactDetailsTable(String safeName, String safeEmail, String safePhone, String safeMessage) {
		return """
				<table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
				  %s
				  %s
				  %s
				  %s
				</table>
				"""
				.formatted(
						deliveryDetailRow("Full name", safeName, false),
						deliveryDetailRow("Email", emailLink(safeEmail), false),
						deliveryDetailRow("Phone", safePhone, false),
						contactMessageRow(safeMessage));
	}

	private static String contactMessageRow(String safeMessage) {
		return """
				<tr>
				  <td width="110" valign="top" style="padding:14px 16px;background:#f8fafc;font-size:14px;font-weight:600;color:#334155;">Message</td>
				  <td valign="top" style="padding:14px 16px;background:#ffffff;font-size:14px;line-height:1.55;color:#334155;white-space:pre-wrap;word-break:break-word;">%s</td>
				</tr>
				"""
				.formatted(safeMessage);
	}

	static String orderStatusUpdate(OrderEmailDetails details, String logoUrl, String frontendUrl) {
		String safeName = escape(details.customerName());
		String safeEmail = escape(details.customerEmail());
		String safePhone = escape(details.phone());
		String safeAddress = escape(details.deliveryAddress());
		String safePayment = escape(details.paymentMethodLabel());
		String headline = orderStatusHeadline(details.status());
		String intro = orderStatusIntro(details.status(), details.paymentMethodLabel());
		String trackUrl = escape(frontendUrl + "/ordertracking");
		String itemsHtml = buildOrderLineItemsHtml(details.lineItems());
		StatusTheme theme = statusTheme(details.status());

		return layout(
				"""
				%s
				<h1 style="margin:0 0 10px;font-size:24px;line-height:1.3;color:#0f172a;font-weight:700;">%s</h1>
				<p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:%s;">Hello <strong>%s</strong>,</p>
				<p style="margin:0 0 24px;font-size:14px;line-height:1.65;color:%s;">%s</p>
				<p style="margin:0 0 10px;font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:%s;">Delivery details</p>
				%s
				<p style="margin:0 0 10px;font-size:13px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:%s;">Order items</p>
				<table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;">
				  <tr>
				    <td style="padding:18px 20px;border-radius:12px;background:#ffffff;border:1px solid #e2e8f0;">
				      %s
				      <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="margin-top:8px;padding-top:12px;border-top:1px solid #e2e8f0;">
				        %s
				        %s
				        <tr>
				          <td style="padding:10px 0 4px;font-size:14px;font-weight:700;color:#0f172a;">Total</td>
				          <td align="right" style="padding:10px 0 4px;font-size:16px;font-weight:700;color:%s;">%s</td>
				        </tr>
				      </table>
				      <p style="margin:12px 0 0;font-size:12px;color:%s;">Payment method: <strong style="color:#334155;">%s</strong></p>
				    </td>
				  </tr>
				</table>
				%s
				"""
						.formatted(
								statusBanner(theme.label(), theme.background(), theme.textColor(), theme.borderColor()),
								escape(headline),
								SLATE,
								safeName,
								MUTED,
								escape(intro),
								MUTED,
								deliveryDetailsTable(safeName, safeEmail, safePhone, safeAddress),
								MUTED,
								itemsHtml,
								summaryRow("Subtotal", formatMoney(details.subtotal())),
								summaryRow("Tax (13%%)", formatMoney(details.tax())),
								TEAL,
								formatMoney(details.total()),
								MUTED,
								safePayment,
								ctaButton(trackUrl, "Track your order", TEAL)),
				orderStatusPreheader(details.status()),
				logoUrl,
				frontendUrl);
	}

	private record StatusTheme(String label, String background, String textColor, String borderColor) {
	}

	private static StatusTheme statusTheme(OrderStatus status) {
		return switch (status) {
			case PENDING -> new StatusTheme("Pending", "#fffbeb", "#b45309", "#fde68a");
			case CONFIRMED -> new StatusTheme("Confirmed", TEAL_LIGHT, TEAL, "#99f6e4");
			case SHIPPED -> new StatusTheme("Shipped", "#ecfeff", "#0e7490", "#a5f3fc");
			case DELIVERED -> new StatusTheme("Delivered", "#ecfdf5", "#047857", "#a7f3d0");
			case CANCELED -> new StatusTheme("Canceled", "#f8fafc", "#64748b", "#e2e8f0");
		};
	}

	private static String orderStatusHeadline(OrderStatus status) {
		return switch (status) {
			case PENDING -> "Your order has been placed and is pending";
			case CONFIRMED -> "Your order has been confirmed";
			case SHIPPED -> "Your order has been shipped";
			case DELIVERED -> "Your order has been delivered";
			case CANCELED -> "Your order has been canceled";
		};
	}

	private static String orderStatusIntro(OrderStatus status, String paymentMethodLabel) {
		String payment = paymentMethodLabel == null ? "your selected payment method" : paymentMethodLabel;
		return switch (status) {
			case PENDING -> paymentIntroPending(payment);
			case CONFIRMED -> "Your order is confirmed and is being prepared by the pharmacy.";
			case SHIPPED -> "Your order is on the way. Please keep your phone available for delivery updates.";
			case DELIVERED -> "Your order has been delivered. Thank you for shopping with " + BRAND + ".";
			case CANCELED -> "Your order was canceled. If you have questions, contact our support team.";
		};
	}

	private static String paymentIntroPending(String paymentMethodLabel) {
		if (paymentMethodLabel.contains("Cash on Delivery")) {
			return "Thank you for your order. Please pay the total amount in cash when your medicines are delivered.";
		}
		if (paymentMethodLabel.contains("eSewa")) {
			return "Thank you for your order. Your payment via eSewa was successful and your order is now pending review.";
		}
		if (paymentMethodLabel.contains("Khalti")) {
			return "Thank you for your order. Your payment via Khalti was successful and your order is now pending review.";
		}
		return "Thank you for your order. We have received your request and it is pending review.";
	}

	private static String orderStatusPreheader(OrderStatus status) {
		return switch (status) {
			case PENDING -> "Your MedNexus order is pending";
			case CONFIRMED -> "Your MedNexus order has been confirmed";
			case SHIPPED -> "Your MedNexus order has been shipped";
			case DELIVERED -> "Your MedNexus order has been delivered";
			case CANCELED -> "Your MedNexus order was canceled";
		};
	}

	private static String buildOrderLineItemsHtml(List<OrderEmailLineItem> lineItems) {
		if (lineItems == null || lineItems.isEmpty()) {
			return """
					<p style="margin:0;font-size:14px;color:%s;">No items found for this order.</p>
					""".formatted(MUTED);
		}
		StringBuilder builder = new StringBuilder();
		for (OrderEmailLineItem item : lineItems) {
			builder.append(orderLineItemRow(item));
		}
		return builder.toString();
	}

	private static String orderLineItemRow(OrderEmailLineItem item) {
		String imageCell = item.imageUrl() != null && !item.imageUrl().isBlank()
				? """
						<img src="%s" alt="" width="56" height="56" style="display:block;width:56px;height:56px;border-radius:8px;border:1px solid #e2e8f0;object-fit:cover;" />
						""".formatted(escape(item.imageUrl()))
				: """
						<div style="width:56px;height:56px;border-radius:8px;background:#f1f5f9;border:1px solid #e2e8f0;"></div>
						""";
		return """
				<table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 12px;padding-bottom:12px;border-bottom:1px solid #e2e8f0;">
				  <tr>
				    <td width="68" valign="top">%s</td>
				    <td valign="top" style="padding:0 12px;">
				      <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#0f172a;">%s</p>
				      <p style="margin:0 0 2px;font-size:12px;color:%s;">SKU: %s</p>
				      <p style="margin:0;font-size:12px;color:%s;">Qty: %d</p>
				    </td>
				    <td valign="top" align="right" style="white-space:nowrap;">
				      <p style="margin:0;font-size:15px;font-weight:700;color:#0f172a;">%s</p>
				    </td>
				  </tr>
				</table>
				"""
				.formatted(
						imageCell,
						escape(item.productName()),
						MUTED,
						escape(item.sku()),
						MUTED,
						item.quantity(),
						formatMoney(item.lineTotal()));
	}

	private static String deliveryDetailsTable(String safeName, String safeEmail, String safePhone, String safeAddress) {
		return """
				<table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
				  %s
				  %s
				  %s
				  %s
				</table>
				"""
				.formatted(
						deliveryDetailRow("Name", safeName, false),
						deliveryDetailRow("Email", emailLink(safeEmail), false),
						deliveryDetailRow("Phone", safePhone, false),
						deliveryDetailRow("Address", safeAddress, true));
	}

	private static String deliveryDetailRow(String label, String value, boolean isLast) {
		String rowBorder = isLast ? "" : "border-bottom:1px solid #e2e8f0;";
		return """
				<tr>
				  <td width="110" valign="top" style="padding:14px 16px;background:#f8fafc;%s font-size:14px;font-weight:600;color:#334155;">%s</td>
				  <td valign="top" style="padding:14px 16px;background:#ffffff;%s font-size:14px;line-height:1.55;color:#334155;">%s</td>
				</tr>
				"""
				.formatted(rowBorder, escape(label), rowBorder, value);
	}

	private static String emailLink(String safeEmail) {
		return """
				<a href="mailto:%s" style="color:#2563eb;text-decoration:underline;">%s</a>
				""".formatted(safeEmail, safeEmail);
	}

	private static String summaryRow(String label, String amount) {
		return """
				<tr>
				  <td style="padding:4px 0;font-size:14px;color:%s;">%s</td>
				  <td align="right" style="padding:4px 0;font-size:14px;font-weight:600;color:#334155;">%s</td>
				</tr>
				"""
				.formatted(MUTED, escape(label), amount);
	}

	private static String formatMoney(BigDecimal amount) {
		if (amount == null) {
			return "Rs. 0";
		}
		DecimalFormat formatter = new DecimalFormat("#,##0.##");
		return "Rs. " + formatter.format(amount);
	}

	private static String statusBanner(String label, String background, String textColor, String borderColor) {
		return """
				<table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;">
				  <tr>
				    <td align="center" style="padding:12px 18px;border-radius:999px;background:%s;border:1px solid %s;">
				      <p style="margin:0;font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:%s;">%s</p>
				    </td>
				  </tr>
				</table>
				"""
				.formatted(background, borderColor, textColor, escape(label));
	}

	private static String businessCard(String safeBusinessName) {
		return """
				<table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;">
				  <tr>
				    <td style="padding:18px 20px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;">
				      <p style="margin:0 0 6px;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:%s;">Pharmacy / business name</p>
				      <p style="margin:0;font-size:18px;line-height:1.35;font-weight:700;color:#0f172a;">%s</p>
				    </td>
				  </tr>
				</table>
				"""
				.formatted(MUTED, safeBusinessName);
	}

	private static String stepRow(String number, String text) {
		return """
				<table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 10px;">
				  <tr>
				    <td width="32" valign="top" style="padding-top:1px;">
				      <span style="display:inline-block;width:24px;height:24px;border-radius:999px;background:#fef3c7;color:#b45309;font-size:12px;font-weight:700;line-height:24px;text-align:center;">%s</span>
				    </td>
				    <td valign="top" style="padding-left:10px;">
				      <p style="margin:0;font-size:14px;line-height:1.6;color:#78350f;">%s</p>
				    </td>
				  </tr>
				</table>
				"""
				.formatted(escape(number), escape(text));
	}

	private static String bulletRow(String text) {
		return """
				<table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 8px;">
				  <tr>
				    <td width="22" valign="top" style="padding-top:2px;color:#047857;font-size:16px;line-height:1;">&#10003;</td>
				    <td valign="top" style="padding-left:8px;">
				      <p style="margin:0;font-size:14px;line-height:1.6;color:#065f46;">%s</p>
				    </td>
				  </tr>
				</table>
				"""
				.formatted(escape(text));
	}

	private static String ctaButton(String href, String label, String background) {
		return """
				<table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="margin:8px 0 16px;">
				  <tr>
				    <td align="center" style="border-radius:10px;background:%s;">
				      <a href="%s" style="display:inline-block;padding:14px 32px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">%s</a>
				    </td>
				  </tr>
				</table>
				"""
				.formatted(background, href, escape(label));
	}

	private static String brandHeader(String logoUrl) {
		if (logoUrl != null && !logoUrl.isBlank()) {
			return """
					<img src="%s" alt="%s" width="168" style="display:block;width:168px;max-width:100%%;height:auto;margin:0 auto;border:0;" />
					"""
					.formatted(escape(logoUrl), BRAND);
		}
		return """
				<p style="margin:0;font-size:30px;line-height:1.1;font-weight:700;letter-spacing:-0.03em;color:%s;">%s</p>
				<p style="margin:8px 0 0;font-size:13px;line-height:1.4;font-weight:500;letter-spacing:0.04em;text-transform:uppercase;color:%s;">Pharmacy Management</p>
				"""
				.formatted(TEAL, BRAND, MUTED);
	}

	private static String layout(String bodyContent, String preheader, String logoUrl, String frontendUrl) {
		String safePreheader = escape(preheader);
		String safeWebsiteUrl = escape(frontendUrl == null || frontendUrl.isBlank() ? "/" : frontendUrl.replaceAll("/$", ""));
		return """
				<!DOCTYPE html>
				<html lang="en">
				<head>
				  <meta charset="UTF-8" />
				  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
				  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
				  <title>%s</title>
				</head>
				<body style="margin:0;padding:0;background-color:#eef2f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
				  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">%s</div>
				  <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="background-color:#eef2f7;padding:32px 16px;">
				    <tr>
				      <td align="center">
				        <table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;">
				          <tr>
				            <td align="center" style="padding-bottom:24px;">
				              %s
				            </td>
				          </tr>
				          <tr>
				            <td style="background-color:#ffffff;border-radius:16px;border:1px solid #e2e8f0;box-shadow:0 8px 24px rgba(15,23,42,0.06);padding:36px 32px;">
				              %s
				            </td>
				          </tr>
				          <tr>
				            <td align="center" style="padding:24px 12px 8px;">
				              <a href="%s" style="font-size:14px;font-weight:600;color:%s;text-decoration:underline;">Visit our website</a>
				            </td>
				          </tr>
				          <tr>
				            <td align="center" style="padding:8px 12px 0;">
				              <p style="margin:0 0 8px;font-size:12px;line-height:1.5;color:%s;">&copy; %s. All rights reserved.</p>
				              <p style="margin:0;font-size:12px;line-height:1.5;color:#94a3b8;">This is an automated message. Please do not reply to this email.</p>
				            </td>
				          </tr>
				        </table>
				      </td>
				    </tr>
				  </table>
				</body>
				</html>
				"""
				.formatted(BRAND, safePreheader, brandHeader(logoUrl), bodyContent, safeWebsiteUrl, TEAL, MUTED, BRAND);
	}

	private static String escape(String value) {
		if (value == null) {
			return "";
		}
		return value
				.replace("&", "&amp;")
				.replace("<", "&lt;")
				.replace(">", "&gt;")
				.replace("\"", "&quot;");
	}
}
