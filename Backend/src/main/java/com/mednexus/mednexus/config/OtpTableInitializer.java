package com.mednexus.mednexus.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/** Ensures {@code otp} exists for email login verification codes. */
@Component
public class OtpTableInitializer implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(OtpTableInitializer.class);

	private final JdbcTemplate jdbc;

	@Autowired
	public OtpTableInitializer(JdbcTemplate jdbc) {
		this.jdbc = jdbc;
	}

	@Override
	public void run(ApplicationArguments args) {
		Integer count = jdbc.queryForObject(
				"SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES "
						+ "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'otp'",
				Integer.class);
		if (count == null || count == 0) {
			createOtpTable();
		}
	}

	private void createOtpTable() {
		log.info("Creating missing `otp` table...");
		jdbc.execute("""
				CREATE TABLE `otp` (
				  `id` bigint NOT NULL AUTO_INCREMENT,
				  `user_id` bigint NOT NULL,
				  `otp_token` varchar(64) NOT NULL,
				  `code` varchar(6) NOT NULL,
				  `expires_at` datetime(6) NOT NULL,
				  `created_at` datetime(6) NOT NULL,
				  PRIMARY KEY (`id`),
				  UNIQUE KEY `uk_otp_token` (`otp_token`),
				  KEY `idx_otp_user` (`user_id`),
				  CONSTRAINT `fk_otp_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
				) ENGINE=InnoDB
				""");
		log.info("`otp` table created.");
	}
}
