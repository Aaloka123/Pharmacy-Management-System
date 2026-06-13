package com.mednexus.mednexus.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/** Ensures {@code vendor_order} exists for customer purchases shown to vendors. */
@Component
public class VendorOrderTableInitializer implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(VendorOrderTableInitializer.class);

	private final JdbcTemplate jdbc;

	@Autowired
	public VendorOrderTableInitializer(JdbcTemplate jdbc) {
		this.jdbc = jdbc;
	}

	@Override
	public void run(ApplicationArguments args) {
		Integer count = jdbc.queryForObject(
				"SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES "
						+ "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vendor_order'",
				Integer.class);
		if (count == null || count == 0) {
			createVendorOrderTable();
		}
	}

	private void createVendorOrderTable() {
		log.info("Creating missing `vendor_order` table...");
		jdbc.execute("""
				CREATE TABLE `vendor_order` (
				  `id` bigint NOT NULL AUTO_INCREMENT,
				  `user_id` bigint NOT NULL,
				  `vendor_id` bigint NOT NULL,
				  `product_id` bigint NOT NULL,
				  `product_name` varchar(200) NOT NULL,
				  `product_sku` varchar(80) NOT NULL,
				  `product_image` varchar(2048) DEFAULT NULL,
				  `unit_price` decimal(12,2) NOT NULL,
				  `quantity` int NOT NULL,
				  `payment_method` varchar(20) NOT NULL,
				  `status` varchar(20) NOT NULL,
				  `created_at` datetime(6) NOT NULL,
				  PRIMARY KEY (`id`),
				  KEY `idx_vendor_order_vendor` (`vendor_id`),
				  KEY `idx_vendor_order_user` (`user_id`),
				  CONSTRAINT `fk_vendor_order_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`),
				  CONSTRAINT `fk_vendor_order_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendor` (`id`),
				  CONSTRAINT `fk_vendor_order_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`)
				) ENGINE=InnoDB
				""");
		log.info("`vendor_order` table created.");
	}
}
