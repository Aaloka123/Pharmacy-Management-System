package com.mednexus.mednexus.storage;

import java.util.HashMap;
import java.util.Map;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.cloudinary.Cloudinary;

@Configuration
@EnableConfigurationProperties(CloudinaryProperties.class)
public class CloudinaryConfig {

	@Bean
	public Cloudinary cloudinary(CloudinaryProperties properties) {
		Map<String, String> config = new HashMap<>();
		config.put("cloud_name", properties.getCloudName());
		config.put("api_key", properties.getApiKey());
		config.put("api_secret", properties.getApiSecret());
		config.put("secure", "true");
		return new Cloudinary(config);
	}
}
