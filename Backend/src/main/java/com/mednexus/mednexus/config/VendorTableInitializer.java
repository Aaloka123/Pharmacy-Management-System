package com.mednexus.mednexus.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/** Ensures {@code vendor.store_status} exists for vendor open/close shop. */
@Component
public class VendorTableInitializer implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(VendorTableInitializer.class);

	private final JdbcTemplate jdbc;

	@Autowired
	public VendorTableInitializer(JdbcTemplate jdbc) {
		this.jdbc = jdbc;
	}

	@Override
	public void run(ApplicationArguments args) {
		Integer count = jdbc.queryForObject(
				"SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES "
						+ "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vendor'",
				Integer.class);
		if (count == null || count == 0) {
			return;
		}
		if (!columnExists("vendor", "store_status")) {
			log.info("Adding `store_status` column to `vendor` table...");
			jdbc.execute(
					"ALTER TABLE `vendor` ADD COLUMN `store_status` varchar(20) NOT NULL DEFAULT 'OPEN'");
		}
		jdbc.execute("UPDATE `vendor` SET `store_status` = 'OPEN' WHERE `status` = 'PENDING'");
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
}
