package com.mednexus.mednexus.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/** Ensures {@code payment_transaction} exists for eSewa checkout sessions. */
@Component
public class PaymentTableInitializer implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(PaymentTableInitializer.class);

	private final JdbcTemplate jdbc;

	@Autowired
	public PaymentTableInitializer(JdbcTemplate jdbc) {
		this.jdbc = jdbc;
	}

	@Override
	public void run(ApplicationArguments args) {
		Integer count = jdbc.queryForObject(
				"SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES "
						+ "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'payment_transaction'",
				Integer.class);
		if (count == null || count == 0) {
			createPaymentTable();
		}
	}

	private void createPaymentTable() {
		log.info("Creating missing `payment_transaction` table...");
		jdbc.execute("""
				CREATE TABLE `payment_transaction` (
				  `id` bigint NOT NULL AUTO_INCREMENT,
				  `user_id` bigint NOT NULL,
				  `transaction_uuid` varchar(64) NOT NULL,
				  `amount` decimal(12,2) NOT NULL,
				  `tax_amount` decimal(12,2) NOT NULL,
				  `total_amount` decimal(12,2) NOT NULL,
				  `cart_item_ids` varchar(2000) NOT NULL,
				  `status` varchar(20) NOT NULL,
				  `created_at` datetime(6) NOT NULL,
				  `completed_at` datetime(6) DEFAULT NULL,
				  PRIMARY KEY (`id`),
				  UNIQUE KEY `uk_payment_transaction_uuid` (`transaction_uuid`),
				  KEY `idx_payment_transaction_user` (`user_id`),
				  CONSTRAINT `fk_payment_transaction_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`)
				) ENGINE=InnoDB
				""");
		log.info("`payment_transaction` table created.");
	}
}
