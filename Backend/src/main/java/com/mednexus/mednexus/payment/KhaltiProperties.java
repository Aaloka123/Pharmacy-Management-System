package com.mednexus.mednexus.payment;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "mednexus.khalti")
public class KhaltiProperties {

	private String secretKey = "";
	private String apiBaseUrl = "https://dev.khalti.com/api/v2";
	private String frontendBaseUrl = "http://localhost:5173";

	public String getSecretKey() {
		return secretKey;
	}

	public void setSecretKey(String secretKey) {
		this.secretKey = secretKey;
	}

	public String getApiBaseUrl() {
		return apiBaseUrl;
	}

	public void setApiBaseUrl(String apiBaseUrl) {
		this.apiBaseUrl = apiBaseUrl;
	}

	public String getFrontendBaseUrl() {
		return frontendBaseUrl;
	}

	public void setFrontendBaseUrl(String frontendBaseUrl) {
		this.frontendBaseUrl = frontendBaseUrl;
	}

	public String initiateUrl() {
		return apiBaseUrl.replaceAll("/$", "") + "/epayment/initiate/";
	}

	public String lookupUrl() {
		return apiBaseUrl.replaceAll("/$", "") + "/epayment/lookup/";
	}

	public String callbackUrl(String backendBaseUrl) {
		return backendBaseUrl.replaceAll("/$", "") + "/api/payments/khalti/callback";
	}
}
