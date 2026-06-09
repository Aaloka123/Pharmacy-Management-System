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
		} else {
			migrateOtpTableForVendors();
		}
	}

	private void createOtpTable() {
		log.info("Creating missing `otp` table...");
		jdbc.execute("""
				CREATE TABLE `otp` (
				  `id` bigint NOT NULL AUTO_INCREMENT,
				  `account_type` varchar(20) NOT NULL,
				  `user_id` bigint DEFAULT NULL,
				  `vendor_id` bigint DEFAULT NULL,
				  `otp_token` varchar(64) NOT NULL,
				  `code` varchar(6) NOT NULL,
				  `expires_at` datetime(6) NOT NULL,
				  `created_at` datetime(6) NOT NULL,
				  PRIMARY KEY (`id`),
				  UNIQUE KEY `uk_otp_token` (`otp_token`),
				  KEY `idx_otp_user` (`user_id`),
				  KEY `idx_otp_vendor` (`vendor_id`),
				  CONSTRAINT `fk_otp_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`),
				  CONSTRAINT `fk_otp_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendor` (`id`)
				) ENGINE=InnoDB
				""");
		log.info("`otp` table created.");
	}

	private void migrateOtpTableForVendors() {
		if (!columnExists("otp", "account_type")) {
			log.info("Migrating `otp` table for vendor login codes...");
			jdbc.execute("ALTER TABLE `otp` ADD COLUMN `account_type` varchar(20) NOT NULL DEFAULT 'USER'");
		}
		if (!columnExists("otp", "vendor_id")) {
			jdbc.execute("ALTER TABLE `otp` ADD COLUMN `vendor_id` bigint DEFAULT NULL");
			jdbc.execute("ALTER TABLE `otp` ADD KEY `idx_otp_vendor` (`vendor_id`)");
			jdbc.execute("""
					ALTER TABLE `otp`
					ADD CONSTRAINT `fk_otp_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendor` (`id`)
					""");
		}
		if (columnIsNotNullable("otp", "user_id")) {
			jdbc.execute("ALTER TABLE `otp` MODIFY COLUMN `user_id` bigint DEFAULT NULL");
		}
	}

	private boolean columnExists(String table, String column) {
		Integer count = jdbc.queryForObject(
				"SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS "
						+ "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
				Integer.class,
				table,
				column);
		return count != null && count > 0;
	}

	private boolean columnIsNotNullable(String table, String column) {
		String nullable = jdbc.queryForObject(
				"SELECT IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS "
						+ "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
				String.class,
				table,
				column);
		return "NO".equalsIgnoreCase(nullable);
	}
}
