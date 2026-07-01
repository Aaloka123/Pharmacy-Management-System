package com.mednexus.mednexus.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
public class ChatTableInitializer implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(ChatTableInitializer.class);

	private final JdbcTemplate jdbc;

	@Autowired
	public ChatTableInitializer(JdbcTemplate jdbc) {
		this.jdbc = jdbc;
	}

	@Override
	public void run(ApplicationArguments args) {
		if (!tableExists("conversation")) {
			createConversationTable();
		}
		if (!tableExists("chat_message")) {
			createChatMessageTable();
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

	private void createConversationTable() {
		log.info("Creating missing `conversation` table...");
		jdbc.execute("""
				CREATE TABLE `conversation` (
				  `id` bigint NOT NULL AUTO_INCREMENT,
				  `user_id` bigint NOT NULL,
				  `vendor_id` bigint NOT NULL,
				  `last_message_at` datetime(6) DEFAULT NULL,
				  `last_message_sender_type` varchar(20) DEFAULT NULL,
				  `last_message_preview` varchar(255) DEFAULT NULL,
				  `user_last_read_at` datetime(6) DEFAULT NULL,
				  `vendor_last_read_at` datetime(6) DEFAULT NULL,
				  `created_at` datetime(6) NOT NULL,
				  PRIMARY KEY (`id`),
				  UNIQUE KEY `uk_conversation_user_vendor` (`user_id`, `vendor_id`),
				  KEY `idx_conversation_vendor` (`vendor_id`),
				  CONSTRAINT `fk_conversation_user` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`),
				  CONSTRAINT `fk_conversation_vendor` FOREIGN KEY (`vendor_id`) REFERENCES `vendor` (`id`)
				) ENGINE=InnoDB
				""");
		log.info("`conversation` table created.");
	}

	private void createChatMessageTable() {
		log.info("Creating missing `chat_message` table...");
		jdbc.execute("""
				CREATE TABLE `chat_message` (
				  `id` bigint NOT NULL AUTO_INCREMENT,
				  `conversation_id` bigint NOT NULL,
				  `sender_type` varchar(20) NOT NULL,
				  `sender_id` bigint NOT NULL,
				  `body` text,
				  `attachment_url` varchar(2048) DEFAULT NULL,
				  `attachment_name` varchar(255) DEFAULT NULL,
				  `attachment_mime_type` varchar(120) DEFAULT NULL,
				  `reply_to_message_id` bigint DEFAULT NULL,
				  `created_at` datetime(6) NOT NULL,
				  PRIMARY KEY (`id`),
				  KEY `idx_chat_message_conversation` (`conversation_id`),
				  KEY `idx_chat_message_created` (`created_at`),
				  CONSTRAINT `fk_chat_message_conversation` FOREIGN KEY (`conversation_id`) REFERENCES `conversation` (`id`) ON DELETE CASCADE
				) ENGINE=InnoDB
				""");
		log.info("`chat_message` table created.");
	}
}
