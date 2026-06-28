package com.mednexus.mednexus.otp;

import java.io.InputStream;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.mednexus.mednexus.storage.CloudinaryProperties;

import jakarta.annotation.PostConstruct;

@Service
public class EmailLogoService {

	private static final Logger log = LoggerFactory.getLogger(EmailLogoService.class);
	private static final String LOGO_RESOURCE = "email/mednexus-logo.png";

	private final Cloudinary cloudinary;
	private final CloudinaryProperties properties;
	private volatile String logoUrl = "";

	public EmailLogoService(Cloudinary cloudinary, CloudinaryProperties properties) {
		this.cloudinary = cloudinary;
		this.properties = properties;
	}

	@PostConstruct
	public void publishLogo() {
		if (!properties.isConfigured()) {
			log.warn("Cloudinary is not configured; email header will use text branding instead of the logo image");
			return;
		}
		try (InputStream input = new ClassPathResource(LOGO_RESOURCE).getInputStream()) {
			byte[] bytes = input.readAllBytes();
			String folder = properties.getFolder().replaceAll("/$", "") + "/branding";

			@SuppressWarnings("unchecked")
			Map<String, Object> result = cloudinary.uploader().upload(
					bytes,
					ObjectUtils.asMap(
							"folder", folder,
							"public_id", "mednexus-logo",
							"overwrite", true,
							"resource_type", "image"));

			Object secureUrl = result.get("secure_url");
			if (secureUrl != null) {
				logoUrl = secureUrl.toString();
				log.info("MedNexus email logo ready at Cloudinary");
			}
		} catch (Exception ex) {
			log.warn("Could not publish MedNexus email logo to Cloudinary", ex);
		}
	}

	public String getLogoUrl() {
		return logoUrl;
	}
}
