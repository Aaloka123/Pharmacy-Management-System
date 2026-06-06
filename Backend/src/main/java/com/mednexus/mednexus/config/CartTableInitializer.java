package com.mednexus.mednexus.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/** Ensures {@code cart} exists for per-user shopping cart rows. */
@Component
public class CartTableInitializer implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(CartTableInitializer.class);

	private final JdbcTemplate jdbc;

	@Autowired
	public CartTableInitializer(JdbcTemplate jdbc) {
		this.jdbc = jdbc;
	}

	@Override
	public void run(ApplicationArguments args) {
		Integer count = jdbc.queryForObject(
				"SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES "
						+ "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cart'",
				Integer.class);
		if (count == null || count == 0) {
			createCartTable();
		}
	}

	private void createCartTable() {
		log.info("Creating missing `cart` table...");
		jdbc.execute("""
				CREATE TABLE `cart` (
				  `id` bigint NOT NULL AUTO_INCREMENT,
				  `user_id` bigint NOT NULL,
				  `product_id` bigint NOT NULL,
				  `quantity` int NOT NULL,
				  `created_at` datetime(6) NOT NULL,
				  `updated_at` datetime(6) NOT NULL,
				  PRIMARY KEY (`id`),
				  UNIQUE KEY `uk_cart_user_product` (`user_id`, `product_id`),
				  CONSTRAINT `fk_cart_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`),
				  CONSTRAINT `fk_cart_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`)
				) ENGINE=InnoDB
				""");
		log.info("`cart` table created.");
	}
}
