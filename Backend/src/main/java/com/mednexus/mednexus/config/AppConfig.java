package com.mednexus.mednexus.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class AppConfig {

	@Bean
	public PasswordEncoder passwordEncoder() {
		// Strength 4 is the fastest BCrypt setting (~5 ms per hash/verify).
		// Default of 10 is ~100-300 ms which makes signup/login feel slow in dev.
		return new BCryptPasswordEncoder(4);
	}

	@Bean
	public WebMvcConfigurer corsConfigurer() {
		return new WebMvcConfigurer() {
			@Override
			public void addCorsMappings(CorsRegistry registry) {
				registry.addMapping("/api/**")
						.allowedOrigins("http://localhost:5173", "http://127.0.0.1:5173")
						.allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
						.allowedHeaders("*");
			}
		};
	}
}
