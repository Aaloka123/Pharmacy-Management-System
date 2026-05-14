package com.mednexus.mednexus;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;

import com.mednexus.mednexus.security.JwtProperties;

@SpringBootApplication
@EnableConfigurationProperties(JwtProperties.class)
public class MednexusApplication {

	public static void main(String[] args) {
		SpringApplication.run(MednexusApplication.class, args);
	}

}
