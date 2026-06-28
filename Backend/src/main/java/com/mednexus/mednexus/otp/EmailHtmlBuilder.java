package com.mednexus.mednexus.otp;

final class EmailHtmlBuilder {

	private static final String BRAND = "MedNexus";
	private static final String TEAL = "#0f766e";
	private static final String TEAL_LIGHT = "#f0fdfa";
	private static final String SLATE = "#334155";
	private static final String MUTED = "#64748b";

	private EmailHtmlBuilder() {
	}

	static String welcomeUser(String greetingName, String frontendUrl) {
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
				"Welcome to " + BRAND);
	}

	static String otpVerification(String headline, String intro, String code, int ttlMinutes) {
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
				headline);
	}

	static String vendorPendingApproval(String greetingName, String businessName) {
		String safeName = escape(greetingName);
		String safeBusiness = escape(businessName);
		return layout(
				"""
				<h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#0f172a;font-weight:700;">Application received</h1>
				<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:%s;">Hello <strong>%s</strong>,</p>
				<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:%s;">
				  Thank you for applying to partner with %s. We have received your application for <strong>%s</strong>.
				</p>
				<table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 20px;">
				  <tr>
				    <td style="padding:16px 18px;border-radius:10px;background:#fffbeb;border:1px solid #fde68a;">
				      <p style="margin:0;font-size:14px;line-height:1.6;color:#92400e;">
				        Your application is <strong>under admin review</strong>. Our team will verify your documents and business details. You will receive another email once your account is approved.
				      </p>
				    </td>
				  </tr>
				</table>
				<p style="margin:0;font-size:14px;line-height:1.6;color:%s;">We appreciate your interest in joining the %s vendor network.</p>
				"""
						.formatted(SLATE, safeName, SLATE, BRAND, safeBusiness, MUTED, BRAND),
				"Vendor application under review");
	}

	static String vendorApprovedWelcome(String greetingName, String businessName, String frontendUrl) {
		String safeName = escape(greetingName);
		String safeBusiness = escape(businessName);
		String safeUrl = escape(frontendUrl);
		return layout(
				"""
				<h1 style="margin:0 0 12px;font-size:22px;line-height:1.3;color:#0f172a;font-weight:700;">You're approved!</h1>
				<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:%s;">Hello <strong>%s</strong>,</p>
				<p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:%s;">
				  Great news — your vendor application for <strong>%s</strong> has been approved. Welcome to the %s vendor portal.
				</p>
				<p style="margin:0 0 24px;font-size:15px;line-height:1.7;color:%s;">
				  You can now log in to manage products, track orders, and serve customers online.
				</p>
				<table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 8px;">
				  <tr>
				    <td style="border-radius:10px;background:%s;">
				      <a href="%s/vendorlogin" style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Go to vendor portal</a>
				    </td>
				  </tr>
				</table>
				<p style="margin:0;font-size:14px;line-height:1.6;color:%s;">Thank you for partnering with %s.</p>
				"""
						.formatted(SLATE, safeName, SLATE, safeBusiness, BRAND, SLATE, TEAL, safeUrl, MUTED, BRAND),
				"Welcome to the " + BRAND + " vendor portal");
	}

	private static String brandHeader() {
		return """
				<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto;">
				  <tr>
				    <td align="center" style="padding-bottom:10px;">
				      <table role="presentation" cellspacing="0" cellpadding="0" border="0">
				        <tr>
				          <td align="center" style="width:52px;height:52px;border-radius:50%%;background-color:%s;font-size:28px;line-height:52px;color:#ffffff;font-weight:700;">
				            +
				          </td>
				        </tr>
				      </table>
				    </td>
				  </tr>
				  <tr>
				    <td align="center">
				      <p style="margin:0;font-size:30px;line-height:1.1;font-weight:700;letter-spacing:-0.03em;color:%s;">%s</p>
				      <p style="margin:8px 0 0;font-size:13px;line-height:1.4;font-weight:500;letter-spacing:0.04em;text-transform:uppercase;color:%s;">Pharmacy Management</p>
				    </td>
				  </tr>
				</table>
				"""
				.formatted(TEAL, TEAL, BRAND, MUTED);
	}

	private static String layout(String bodyContent, String preheader) {
		String safePreheader = escape(preheader);
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
				            <td align="center" style="padding:24px 12px 0;">
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
				.formatted(BRAND, safePreheader, brandHeader(), bodyContent, MUTED, BRAND);
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
