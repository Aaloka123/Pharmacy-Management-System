package com.mednexus.mednexus.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class ReviewTableInitializer implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(ReviewTableInitializer.class);

	private final JdbcTemplate jdbc;

	@Autowired
	public ReviewTableInitializer(JdbcTemplate jdbc) {
		this.jdbc = jdbc;
	}

	@Override
	public void run(ApplicationArguments args) {
		if (!tableExists("product_review")) {
			createProductReviewTable();
		}
		if (!tableExists("review_like")) {
			createReviewLikeTable();
		}
		dropOneReviewPerUserConstraintIfPresent();
	}

	private boolean tableExists(String tableName) {
		Integer count = jdbc.queryForObject(
				"SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES "
						+ "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?",
				Integer.class,
				tableName);
		return count != null && count > 0;
	}

	private void createProductReviewTable() {
		log.info("Creating missing `product_review` table...");
		jdbc.execute("""
				CREATE TABLE `product_review` (
				  `id` bigint NOT NULL AUTO_INCREMENT,
				  `product_id` bigint NOT NULL,
				  `user_id` bigint NOT NULL,
				  `vendor_order_id` bigint DEFAULT NULL,
				  `rating` tinyint NOT NULL,
				  `body` text NOT NULL,
				  `image_url` varchar(2048) DEFAULT NULL,
				  `created_at` datetime(6) NOT NULL,
				  `updated_at` datetime(6) NOT NULL,
				  PRIMARY KEY (`id`),
				  KEY `idx_review_user_product` (`user_id`, `product_id`),
				  KEY `idx_review_product` (`product_id`),
				  KEY `idx_review_vendor_order` (`vendor_order_id`),
				  CONSTRAINT `fk_review_product` FOREIGN KEY (`product_id`) REFERENCES `product` (`id`),
				  CONSTRAINT `fk_review_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`),
				  CONSTRAINT `fk_review_vendor_order` FOREIGN KEY (`vendor_order_id`) REFERENCES `vendor_order` (`id`)
				) ENGINE=InnoDB
				""");
		log.info("`product_review` table created.");
	}

	private void createReviewLikeTable() {
		log.info("Creating missing `review_like` table...");
		jdbc.execute("""
				CREATE TABLE `review_like` (
				  `id` bigint NOT NULL AUTO_INCREMENT,
				  `review_id` bigint NOT NULL,
				  `user_id` bigint NOT NULL,
				  `created_at` datetime(6) NOT NULL,
				  PRIMARY KEY (`id`),
				  UNIQUE KEY `uk_review_like_user` (`review_id`, `user_id`),
				  KEY `idx_review_like_user` (`user_id`),
				  CONSTRAINT `fk_review_like_review` FOREIGN KEY (`review_id`) REFERENCES `product_review` (`id`) ON DELETE CASCADE,
				  CONSTRAINT `fk_review_like_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
				) ENGINE=InnoDB
				""");
		log.info("`review_like` table created.");
	}

	private void dropOneReviewPerUserConstraintIfPresent() {
		if (!tableExists("product_review")) {
			return;
		}
		Integer count = jdbc.queryForObject(
				"""
				SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS
				WHERE TABLE_SCHEMA = DATABASE()
				  AND TABLE_NAME = 'product_review'
				  AND CONSTRAINT_NAME = 'uk_review_user_product'
				""",
				Integer.class);
		if (count != null && count > 0) {
			log.info("Allowing multiple reviews per user — dropping uk_review_user_product...");
			jdbc.execute("ALTER TABLE `product_review` DROP INDEX `uk_review_user_product`");
		}
	}
}
