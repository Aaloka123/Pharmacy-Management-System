package com.mednexus.mednexus.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/** Ensures {@code notification} exists for user order updates. */
@Component
public class NotificationTableInitializer implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(NotificationTableInitializer.class);

	private final JdbcTemplate jdbc;

	@Autowired
	public NotificationTableInitializer(JdbcTemplate jdbc) {
		this.jdbc = jdbc;
	}

	@Override
	public void run(ApplicationArguments args) {
		Integer count = jdbc.queryForObject(
				"SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES "
						+ "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notification'",
				Integer.class);
		if (count == null || count == 0) {
			createNotificationTable();
		} else {
			migrateNotificationTable();
		}
	}

	private void createNotificationTable() {
		log.info("Creating missing `notification` table...");
		jdbc.execute("""
				CREATE TABLE `notification` (
				  `id` bigint NOT NULL AUTO_INCREMENT,
				  `user_id` bigint NOT NULL,
				  `order_id` bigint DEFAULT NULL,
				  `message` varchar(500) NOT NULL,
				  `product_image` varchar(2048) DEFAULT NULL,
				  `is_read` tinyint(1) NOT NULL DEFAULT 0,
				  `created_at` datetime(6) NOT NULL,
				  PRIMARY KEY (`id`),
				  KEY `idx_notification_user` (`user_id`),
				  KEY `idx_notification_user_read` (`user_id`, `is_read`),
				  CONSTRAINT `fk_notification_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
				) ENGINE=InnoDB
				""");
		log.info("`notification` table created.");
	}

	private void migrateNotificationTable() {
		if (!columnExists("notification", "product_image")) {
			log.info("Migrating `notification` table for product images...");
			jdbc.execute("ALTER TABLE `notification` ADD COLUMN `product_image` varchar(2048) DEFAULT NULL");
		}
	}

	private boolean columnExists(String tableName, String columnName) {
		Integer count = jdbc.queryForObject(
				"SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS "
						+ "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
				Integer.class,
				tableName,
				columnName);
		return count != null && count > 0;
	}
}
