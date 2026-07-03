package com.mednexus.mednexus.config;

import java.util.Properties;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.JavaMailSenderImpl;

@Configuration
public class MailConfig {

	private static final Logger log = LoggerFactory.getLogger(MailConfig.class);

	@Bean
	@Primary
	public JavaMailSender javaMailSender(
			@Value("${spring.mail.host:smtp.gmail.com}") String host,
			@Value("${spring.mail.port:587}") int port,
			@Value("${spring.mail.username:}") String username,
			@Value("${spring.mail.password:}") String password,
			@Value("${mednexus.mail.ssl-relaxed:false}") boolean sslRelaxed) {
		if (username == null || username.isBlank() || password == null || password.isBlank()) {
			log.warn("SMTP credentials are missing. Set spring.mail.username and spring.mail.password (Gmail App Password). Emails will fail until configured.");
		}

		JavaMailSenderImpl sender = new JavaMailSenderImpl();
		sender.setHost(host);
		sender.setPort(port);
		sender.setUsername(username);
		sender.setPassword(password);
		sender.setDefaultEncoding("UTF-8");

		Properties props = sender.getJavaMailProperties();
		props.put("mail.transport.protocol", "smtp");
		props.put("mail.smtp.auth", "true");
		props.put("mail.smtp.connectiontimeout", "10000");
		props.put("mail.smtp.timeout", "10000");
		props.put("mail.smtp.writetimeout", "10000");
		props.put("mail.smtp.ssl.protocols", "TLSv1.2");

		if (port == 465) {
			props.put("mail.smtp.ssl.enable", "true");
			props.put("mail.smtp.socketFactory.port", "465");
			props.put("mail.smtp.socketFactory.class", "javax.net.ssl.SSLSocketFactory");
			props.put("mail.smtp.socketFactory.fallback", "false");
		} else {
			props.put("mail.smtp.starttls.enable", "true");
			props.put("mail.smtp.starttls.required", "true");
		}

		if (sslRelaxed) {
			props.put("mail.smtp.ssl.trust", "*");
			props.put("mail.smtp.ssl.checkserveridentity", "false");
			log.warn("SMTP SSL certificate validation is relaxed (mednexus.mail.ssl-relaxed=true). Use only for local development.");
		} else {
			props.put("mail.smtp.ssl.trust", host);
		}

		return sender;
	}
}
