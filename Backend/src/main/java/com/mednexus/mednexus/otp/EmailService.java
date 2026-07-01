package com.mednexus.mednexus.otp;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import com.mednexus.mednexus.order.OrderStatus;
import com.mednexus.mednexus.order.dto.OrderEmailDetails;
import com.mednexus.mednexus.order.dto.OrderEmailLineItem;
import com.mednexus.mednexus.vendor.StoreStatus;

import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

	private static final Logger log = LoggerFactory.getLogger(EmailService.class);
	private static final int OTP_TTL_MINUTES = 10;

	private final JavaMailSender mailSender;
	private final String fromAddress;
	private final String frontendBaseUrl;
	private final EmailLogoService emailLogoService;

	@Autowired
	public EmailService(
			JavaMailSender mailSender,
			@Value("${mednexus.mail.from:${spring.mail.username}}") String fromAddress,
			@Value("${mednexus.mail.frontend-base-url:${mednexus.esewa.frontend-base-url:http://localhost:5173}}") String frontendBaseUrl,
			EmailLogoService emailLogoService) {
		this.mailSender = mailSender;
		this.fromAddress = fromAddress;
		this.frontendBaseUrl = frontendBaseUrl.replaceAll("/$", "");
		this.emailLogoService = emailLogoService;
	}

	public void sendLoginOtp(String toEmail, String code) {
		sendOtpEmail(
				toEmail,
				code,
				"Your MedNexus login verification code",
				"Verify your login",
				"Use the verification code below to sign in to your MedNexus account.");
	}

	public void sendVendorLoginOtp(String toEmail, String code) {
		sendOtpEmail(
				toEmail,
				code,
				"Your MedNexus vendor login verification code",
				"Verify your vendor login",
				"Use the verification code below to sign in to the MedNexus vendor portal.");
	}

	public void sendPasswordResetOtp(String toEmail, String code) {
		sendOtpEmail(
				toEmail,
				code,
				"Your MedNexus password reset code",
				"Reset your password",
				"Use the verification code below to reset your MedNexus account password.");
	}

	public void sendVendorPasswordResetOtp(String toEmail, String code) {
		sendOtpEmail(
				toEmail,
				code,
				"Your MedNexus vendor password reset code",
				"Reset your vendor password",
				"Use the verification code below to reset your MedNexus vendor portal password.");
	}

	private void sendOtpEmail(String toEmail, String code, String subject, String headline, String intro) {
		String logoUrl = emailLogoService.getLogoUrl();
		String html = EmailHtmlBuilder.otpVerification(headline, intro, code, OTP_TTL_MINUTES, logoUrl, frontendBaseUrl);
		String plainText = """
				%s

				Your verification code is: %s

				This code expires in %d minutes. Do not share it with anyone.

				— The MedNexus Team
				""".formatted(intro, code, OTP_TTL_MINUTES);
		sendHtmlEmail(toEmail, subject, html, plainText);
	}

	public void sendWelcomeEmail(String toEmail, String fullName) {
		String greetingName = fullName == null || fullName.isBlank() ? "there" : fullName.trim();
		String html = EmailHtmlBuilder.welcomeUser(greetingName, frontendBaseUrl, emailLogoService.getLogoUrl());
		String plainText = """
				Hello %s,

				Welcome to MedNexus!

				Your account has been created successfully. You can now browse medicines, explore partner pharmacies, and manage your orders with confidence.

				Visit us: %s

				— The MedNexus Team
				""".formatted(greetingName, frontendBaseUrl);
		sendHtmlEmail(toEmail, "Welcome to MedNexus", html, plainText);
	}

	public void sendVendorPendingApprovalEmail(String toEmail, String vendorName, String businessName) {
		String greetingName = vendorName == null || vendorName.isBlank() ? "there" : vendorName.trim();
		String business = businessName == null || businessName.isBlank() ? "your pharmacy" : businessName.trim();
		String html = EmailHtmlBuilder.vendorPendingApproval(greetingName, business, emailLogoService.getLogoUrl(), frontendBaseUrl);
		String plainText = """
				Hello %s,

				Thank you for applying to join MedNexus as a partner pharmacy.

				APPLICATION IS UNDER REVIEW

				Business: %s

				What happens next:
				1. Our admin team verifies your certificates and business details.
				2. We confirm your pharmacy license and registration information.
				3. You receive an approval or update email within a few business days.

				No action is needed from you right now.

				— The MedNexus Team
				""".formatted(greetingName, business);
		sendHtmlEmail(toEmail, "Your MedNexus vendor application is under review", html, plainText);
	}

	public void sendVendorApprovedWelcomeEmail(String toEmail, String vendorName, String businessName) {
		String greetingName = vendorName == null || vendorName.isBlank() ? "there" : vendorName.trim();
		String business = businessName == null || businessName.isBlank() ? "your pharmacy" : businessName.trim();
		String html = EmailHtmlBuilder.vendorApprovedWelcome(greetingName, business, frontendBaseUrl, emailLogoService.getLogoUrl());
		String plainText = """
				Hello %s,

				Great news — your vendor application has been APPROVED!

				Business: %s

				You can now:
				- Add and manage your product catalog
				- Receive and track customer orders
				- Update store details and certificates anytime

				Go to vendor portal: %s/vendorlogin

				— The MedNexus Team
				""".formatted(greetingName, business, frontendBaseUrl);
		sendHtmlEmail(toEmail, "Welcome to the MedNexus vendor portal", html, plainText);
	}

	public void sendVendorRejectedEmail(String toEmail, String vendorName, String businessName) {
		String greetingName = vendorName == null || vendorName.isBlank() ? "there" : vendorName.trim();
		String business = businessName == null || businessName.isBlank() ? "your pharmacy" : businessName.trim();
		String html = EmailHtmlBuilder.vendorRejectedApplication(greetingName, business, emailLogoService.getLogoUrl(), frontendBaseUrl);
		String plainText = """
				Hello %s,

				Thank you for applying to join MedNexus as a partner pharmacy.

				APPLICATION NOT APPROVED

				Business: %s

				After review, our admin team was unable to approve your application at this time.
				You may submit a new application with updated documents: %s/vendorsignup

				If you believe this decision was made in error, please contact our support team through the website.

				— The MedNexus Team
				""".formatted(greetingName, business, frontendBaseUrl);
		sendHtmlEmail(toEmail, "Update on your MedNexus vendor application", html, plainText);
	}

	public void sendStoreStatusChangeEmail(
			String toEmail,
			String vendorName,
			String businessName,
			StoreStatus newStatus,
			boolean changedByAdmin) {
		if (toEmail == null || toEmail.isBlank() || newStatus == null) {
			return;
		}
		boolean storeOpen = newStatus == StoreStatus.OPEN;
		String greetingName = vendorName == null || vendorName.isBlank() ? "there" : vendorName.trim();
		String business = businessName == null || businessName.isBlank() ? "your pharmacy" : businessName.trim();
		String subject = storeOpen
				? "Your MedNexus store is now open"
				: "Your MedNexus store has been temporarily closed";
		String html = EmailHtmlBuilder.storeStatusChange(
				greetingName,
				business,
				storeOpen,
				changedByAdmin,
				emailLogoService.getLogoUrl(),
				frontendBaseUrl);
		String plainText = buildStoreStatusPlainText(greetingName, business, storeOpen, changedByAdmin);
		sendHtmlEmail(toEmail, subject, html, plainText);
	}

	private String buildStoreStatusPlainText(
			String greetingName,
			String businessName,
			boolean storeOpen,
			boolean changedByAdmin) {
		String headline = storeOpen ? "Your store is now open" : "Your store has been temporarily closed";
		String detail;
		if (storeOpen) {
			detail = changedByAdmin
					? "An administrator has reopened your store on MedNexus. Customers can browse your products and place orders again."
					: "Your store status on MedNexus is now set to open. Customers can browse your products and place orders.";
		} else {
			detail = changedByAdmin
					? "An administrator has temporarily closed your store on MedNexus. Customers will not be able to place new orders until an administrator reopens it."
					: "You have temporarily closed your store on MedNexus. Customers will not be able to place new orders until you reopen it from the vendor portal.";
		}
		return """
				Hello %s,

				%s

				Business: %s

				%s

				Go to vendor portal: %s/vendordashboard

				— The MedNexus Team
				"""
				.formatted(greetingName, headline, businessName, detail, frontendBaseUrl);
	}

	public void sendOrderStatusEmail(OrderEmailDetails details) {
		if (details == null || details.toEmail() == null || details.toEmail().isBlank()) {
			return;
		}
		String subject = orderStatusSubject(details.status());
		String html = EmailHtmlBuilder.orderStatusUpdate(details, emailLogoService.getLogoUrl(), frontendBaseUrl);
		String plainText = buildOrderStatusPlainText(details, frontendBaseUrl);
		sendHtmlEmail(details.toEmail(), subject, html, plainText);
	}

	private static String orderStatusSubject(OrderStatus status) {
		return switch (status) {
			case PENDING -> "Your MedNexus order is pending";
			case CONFIRMED -> "Your MedNexus order has been confirmed";
			case SHIPPED -> "Your MedNexus order has been shipped";
			case DELIVERED -> "Your MedNexus order has been delivered";
			case CANCELED -> "Your MedNexus order was canceled";
		};
	}

	private static String buildOrderStatusPlainText(OrderEmailDetails details, String frontendBaseUrl) {
		StringBuilder items = new StringBuilder();
		for (OrderEmailLineItem item : details.lineItems()) {
			items.append("- ")
					.append(item.productName())
					.append(" (SKU: ")
					.append(item.sku())
					.append(") x")
					.append(item.quantity())
					.append(" — Rs. ")
					.append(item.lineTotal())
					.append('\n');
		}
		return """
				Hello %s,

				%s

				Delivery details
				Name: %s
				Email: %s
				Phone: %s
				Address: %s

				Order items
				%s
				Subtotal: Rs. %s
				Tax (13%%): Rs. %s
				Total: Rs. %s
				Payment method: %s

				Track your order: %s/ordertracking

				— The MedNexus Team
				"""
				.formatted(
						details.customerName(),
						orderStatusHeadlinePlain(details.status()),
						details.customerName(),
						details.customerEmail(),
						details.phone(),
						details.deliveryAddress(),
						items.toString(),
						details.subtotal(),
						details.tax(),
						details.total(),
						details.paymentMethodLabel(),
						frontendBaseUrl);
	}

	private static String orderStatusHeadlinePlain(OrderStatus status) {
		return switch (status) {
			case PENDING -> "Your order has been placed and is pending.";
			case CONFIRMED -> "Your order has been confirmed.";
			case SHIPPED -> "Your order has been shipped.";
			case DELIVERED -> "Your order has been delivered.";
			case CANCELED -> "Your order has been canceled.";
		};
	}

	private void sendHtmlEmail(String toEmail, String subject, String html, String plainText) {
		try {
			MimeMessage message = mailSender.createMimeMessage();
			MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
			helper.setFrom(fromAddress, "MedNexus");
			helper.setTo(toEmail);
			helper.setSubject(subject);
			helper.setText(plainText, html);
			mailSender.send(message);
		} catch (Exception ex) {
			log.error("Failed to send email to {}", toEmail, ex);
		}
	}
}
