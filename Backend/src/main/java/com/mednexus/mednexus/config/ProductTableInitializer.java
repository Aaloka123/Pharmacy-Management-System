package com.mednexus.mednexus.config;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/** Ensures {@code product} exists and LOB columns are wide enough for image URL lists. */
@Component
public class ProductTableInitializer implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(ProductTableInitializer.class);

	private static final List<String> LONG_TEXT_COLUMNS = List.of(
			"product_description",
			"dosage_instructions",
			"side_effects",
			"images");

	private final JdbcTemplate jdbc;

	@Autowired
	public ProductTableInitializer(JdbcTemplate jdbc) {
		this.jdbc = jdbc;
	}

	@Override
	public void run(ApplicationArguments args) {
		Integer count = jdbc.queryForObject(
				"SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES "
						+ "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product'",
				Integer.class);
		if (count == null || count == 0) {
			createProductTable();
			return;
		}
		widenLongTextColumns();
	}

	private void createProductTable() {
		log.info("Creating missing `product` table...");
		jdbc.execute("""
				CREATE TABLE `product` (
				  `id` bigint NOT NULL AUTO_INCREMENT,
				  `vendor_id` bigint NOT NULL,
				  `product_name` varchar(200) NOT NULL,
				  `sku` varchar(80) NOT NULL,
				  `category` varchar(100) NOT NULL,
				  `strength` varchar(50) NOT NULL,
				  `form` varchar(50) NOT NULL,
				  `quantity` varchar(50) NOT NULL,
				  `storage_requirements` varchar(500) NOT NULL,
				  `expiry_date` date NOT NULL,
				  `product_description` longtext NOT NULL,
				  `dosage_instructions` longtext NOT NULL,
				  `side_effects` longtext NOT NULL,
				  `price` decimal(12,2) NOT NULL,
				  `stock` int NOT NULL,
				  `status` varchar(20) NOT NULL,
				  `images` longtext NOT NULL,
				  `created_at` datetime(6) NOT NULL,
				  `updated_at` datetime(6) NOT NULL,
				  PRIMARY KEY (`id`),
				  UNIQUE KEY `uk_product_vendor_sku` (`vendor_id`, `sku`),
				  CONSTRAINT `fk_product_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendor` (`id`)
				) ENGINE=InnoDB
				""");
		log.info("`product` table created.");
	}

	private void widenLongTextColumns() {
		for (String column : LONG_TEXT_COLUMNS) {
			String dataType = jdbc.queryForObject(
					"SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS "
							+ "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product' AND COLUMN_NAME = ?",
					String.class,
					column);
			if (dataType == null) {
				continue;
			}
			if ("longtext".equalsIgnoreCase(dataType) || "mediumtext".equalsIgnoreCase(dataType)) {
				continue;
			}
			try {
				jdbc.execute("ALTER TABLE `product` MODIFY COLUMN `" + column + "` LONGTEXT NOT NULL");
				log.info("Widened `product`.`{}` to LONGTEXT (was {}).", column, dataType);
			} catch (Exception ex) {
				log.warn("Could not widen `product`.`{}`: {}", column, ex.getMessage());
			}
		}
	}
}
