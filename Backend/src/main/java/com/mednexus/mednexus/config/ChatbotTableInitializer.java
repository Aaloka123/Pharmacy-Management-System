package com.mednexus.mednexus.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class ChatbotTableInitializer implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(ChatbotTableInitializer.class);

	private final JdbcTemplate jdbc;

	@Autowired
	public ChatbotTableInitializer(JdbcTemplate jdbc) {
		this.jdbc = jdbc;
	}

	@Override
	public void run(ApplicationArguments args) {
		if (!tableExists("chatbot_message")) {
			createChatbotMessageTable();
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

	private void createChatbotMessageTable() {
		log.info("Creating missing `chatbot_message` table...");
		jdbc.execute("""
				CREATE TABLE `chatbot_message` (
				  `id` bigint NOT NULL AUTO_INCREMENT,
				  `owner_type` varchar(20) NOT NULL,
				  `owner_id` bigint NOT NULL,
				  `role` varchar(20) NOT NULL,
				  `body` text NOT NULL,
				  `products_json` text DEFAULT NULL,
				  `created_at` datetime(6) NOT NULL,
				  PRIMARY KEY (`id`),
				  KEY `idx_chatbot_message_owner` (`owner_type`, `owner_id`, `created_at`)
				) ENGINE=InnoDB
				""");
		log.info("`chatbot_message` table created.");
	}
}
