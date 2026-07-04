package com.mednexus.mednexus.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/** Ensures {@code bill} and {@code bill_line} exist for vendor invoices. */
@Component
public class BillTableInitializer implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(BillTableInitializer.class);

	private final JdbcTemplate jdbc;

	@Autowired
	public BillTableInitializer(JdbcTemplate jdbc) {
		this.jdbc = jdbc;
	}

	@Override
	public void run(ApplicationArguments args) {
		Integer billCount = jdbc.queryForObject(
				"SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES "
						+ "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bill'",
				Integer.class);
		if (billCount == null || billCount == 0) {
			createBillTable();
		}

		Integer lineCount = jdbc.queryForObject(
				"SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES "
						+ "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bill_line'",
				Integer.class);
		if (lineCount == null || lineCount == 0) {
			createBillLineTable();
		}
	}

	private void createBillTable() {
		log.info("Creating missing `bill` table...");
		jdbc.execute("""
				CREATE TABLE `bill` (
				  `id` bigint NOT NULL AUTO_INCREMENT,
				  `vendor_id` bigint NOT NULL,
				  `invoice_number` varchar(40) NOT NULL,
				  `invoice_date` date NOT NULL,
				  `due_date` date DEFAULT NULL,
				  `payment_terms` varchar(80) DEFAULT NULL,
				  `payment_method` varchar(20) NOT NULL,
				  `status` varchar(20) NOT NULL,
				  `bill_to_name` varchar(120) NOT NULL,
				  `bill_to_email` varchar(120) DEFAULT NULL,
				  `bill_to_phone` varchar(20) DEFAULT NULL,
				  `bill_to_address` varchar(500) DEFAULT NULL,
				  `vendor_business_name` varchar(200) NOT NULL,
				  `vendor_pan_vat_id` varchar(80) DEFAULT NULL,
				  `vendor_business_location` varchar(300) DEFAULT NULL,
				  `vendor_phone` varchar(20) DEFAULT NULL,
				  `vendor_email` varchar(120) DEFAULT NULL,
				  `subtotal` decimal(12,2) NOT NULL,
				  `tax_percent` decimal(5,2) NOT NULL,
				  `tax_amount` decimal(12,2) NOT NULL,
				  `discount_percent` decimal(5,2) NOT NULL,
				  `discount_amount` decimal(12,2) NOT NULL,
				  `total_amount` decimal(12,2) NOT NULL,
				  `created_at` datetime(6) NOT NULL,
				  PRIMARY KEY (`id`),
				  UNIQUE KEY `uk_bill_vendor_invoice` (`vendor_id`, `invoice_number`),
				  KEY `idx_bill_vendor` (`vendor_id`),
				  CONSTRAINT `fk_bill_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendor` (`id`)
				) ENGINE=InnoDB
				""");
		log.info("`bill` table created.");
	}

	private void createBillLineTable() {
		log.info("Creating missing `bill_line` table...");
		jdbc.execute("""
				CREATE TABLE `bill_line` (
				  `id` bigint NOT NULL AUTO_INCREMENT,
				  `bill_id` bigint NOT NULL,
				  `product_name` varchar(200) NOT NULL,
				  `description` varchar(500) DEFAULT NULL,
				  `quantity` int NOT NULL,
				  `unit_price` decimal(12,2) NOT NULL,
				  `line_amount` decimal(12,2) NOT NULL,
				  `sort_order` int NOT NULL,
				  PRIMARY KEY (`id`),
				  KEY `idx_bill_line_bill` (`bill_id`),
				  CONSTRAINT `fk_bill_line_bill` FOREIGN KEY (`bill_id`) REFERENCES `bill` (`id`) ON DELETE CASCADE
				) ENGINE=InnoDB
				""");
		log.info("`bill_line` table created.");
	}
}
