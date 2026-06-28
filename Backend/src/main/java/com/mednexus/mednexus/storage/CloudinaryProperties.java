package com.mednexus.mednexus.storage;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "cloudinary")
public class CloudinaryProperties {

	private String cloudName = "";
	private String apiKey = "";
	private String apiSecret = "";
	private String folder = "mednexus";

	public String getCloudName() {
		return cloudName;
	}

	public void setCloudName(String cloudName) {
		this.cloudName = cloudName;
	}

	public String getApiKey() {
		return apiKey;
	}

	public void setApiKey(String apiKey) {
		this.apiKey = apiKey;
	}

	public String getApiSecret() {
		return apiSecret;
	}

	public void setApiSecret(String apiSecret) {
		this.apiSecret = apiSecret;
	}

	public String getFolder() {
		return folder;
	}

	public void setFolder(String folder) {
		this.folder = folder;
	}

	public boolean isConfigured() {
		return cloudName != null && !cloudName.isBlank()
				&& apiKey != null && !apiKey.isBlank()
				&& apiSecret != null && !apiSecret.isBlank();
	}
}
