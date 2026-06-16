package com.mednexus.mednexus.payment;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "mednexus.esewa")
public class EsewaProperties {

	private String productCode = "EPAYTEST";
	private String secretKey = "8gBm/:&EnhH.1/q";
	private String formUrl = "https://rc-epay.esewa.com.np/api/epay/main/v2/form";
	private String statusUrl = "https://rc-epay.esewa.com.np/api/epay/transaction/status/";
	private String frontendBaseUrl = "http://localhost:5173";

	public String getProductCode() {
		return productCode;
	}

	public void setProductCode(String productCode) {
		this.productCode = productCode;
	}

	public String getSecretKey() {
		return secretKey;
	}

	public void setSecretKey(String secretKey) {
		this.secretKey = secretKey;
	}

	public String getFormUrl() {
		return formUrl;
	}

	public void setFormUrl(String formUrl) {
		this.formUrl = formUrl;
	}

	public String getStatusUrl() {
		return statusUrl;
	}

	public void setStatusUrl(String statusUrl) {
		this.statusUrl = statusUrl;
	}

	public String getFrontendBaseUrl() {
		return frontendBaseUrl;
	}

	public void setFrontendBaseUrl(String frontendBaseUrl) {
		this.frontendBaseUrl = frontendBaseUrl;
	}

	public String successCallbackUrl(String backendBaseUrl) {
		return backendBaseUrl + "/api/payments/esewa/success";
	}

	public String failureCallbackUrl(String backendBaseUrl) {
		return backendBaseUrl + "/api/payments/esewa/failure";
	}
}
