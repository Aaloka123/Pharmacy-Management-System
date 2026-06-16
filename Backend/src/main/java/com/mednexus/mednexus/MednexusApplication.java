package com.mednexus.mednexus;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.scheduling.annotation.EnableScheduling;

import com.mednexus.mednexus.payment.EsewaProperties;
import com.mednexus.mednexus.security.JwtProperties;

@SpringBootApplication
@EnableConfigurationProperties({ JwtProperties.class, EsewaProperties.class })
@EnableScheduling
public class MednexusApplication {

	public static void main(String[] args) {
		SpringApplication.run(MednexusApplication.class, args);
	}

}
