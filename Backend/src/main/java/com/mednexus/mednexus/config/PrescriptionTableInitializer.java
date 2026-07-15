package com.mednexus.mednexus.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class PrescriptionTableInitializer implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(PrescriptionTableInitializer.class);

	private final JdbcTemplate jdbc;

	@Autowired
	public PrescriptionTableInitializer(JdbcTemplate jdbc) {
		this.jdbc = jdbc;
	}

	@Override
	public void run(ApplicationArguments args) {
		if (!tableExists("prescription")) {
			createPrescriptionTable();
		}
	}

	private boolean tableExists(String tableName) {
		Integer count = jdbc.queryForObject(
				"SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES "
						+ "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?",
				Integer.class,
				tableName);
		return count != null && count > 0;
	}

	private void createPrescriptionTable() {
		log.info("Creating missing `prescription` table...");
		jdbc.execute("""
				CREATE TABLE `prescription` (
				  `id` bigint NOT NULL AUTO_INCREMENT,
				  `user_id` bigint NOT NULL,
				  `image_url` varchar(2048) NOT NULL,
				  `full_text` text NOT NULL,
				  `medicines_json` text NOT NULL,
				  `doctor_notes` text DEFAULT NULL,
				  `created_at` datetime(6) NOT NULL,
				  PRIMARY KEY (`id`),
				  KEY `idx_prescription_user_created` (`user_id`, `created_at`),
				  CONSTRAINT `fk_prescription_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
				) ENGINE=InnoDB
				""");
		log.info("`prescription` table created.");
	}
}
