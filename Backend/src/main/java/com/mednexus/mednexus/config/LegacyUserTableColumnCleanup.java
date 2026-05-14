package com.mednexus.mednexus.config;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/** Drops duplicate camelCase columns on {@code user} when snake_case columns already exist (legacy ddl-auto). */
@Component
public class LegacyUserTableColumnCleanup implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(LegacyUserTableColumnCleanup.class);

	private final JdbcTemplate jdbc;

	public LegacyUserTableColumnCleanup(JdbcTemplate jdbc) {
		this.jdbc = jdbc;
	}

	@Override
	public void run(ApplicationArguments args) {
		List<String> columns = jdbc.queryForList(
				"SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS "
						+ "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'user'",
				String.class);
		if (columns.isEmpty()) {
			log.debug("No columns found for table user in current database; skip legacy column cleanup.");
			return;
		}

		dropCamelIfSnakeExists(columns, "full_name", "fullName");
		dropCamelIfSnakeExists(columns, "phone_number", "phoneNumber");
		dropCamelIfSnakeExists(columns, "profile_image", "profileImage");
	}

	private void dropCamelIfSnakeExists(List<String> columns, String snake, String camel) {
		String snakeCol = findIgnoreCase(columns, snake);
		String camelCol = findIgnoreCase(columns, camel);
		if (snakeCol == null || camelCol == null) {
			return;
		}
		if (snakeCol.equals(camelCol)) {
			return;
		}
		try {
			jdbc.execute("ALTER TABLE `user` DROP COLUMN `" + camelCol + "`");
			log.info("Dropped duplicate column `{}` from `user` (keeping `{}`).", camelCol, snakeCol);
		} catch (Exception ex) {
			log.warn("Could not drop duplicate column `{}` from `user`: {}. Run manually: ALTER TABLE `user` DROP COLUMN `{}`;",
					camelCol, ex.getMessage(), camelCol);
		}
	}

	private static String findIgnoreCase(List<String> columns, String target) {
		for (String c : columns) {
			if (c != null && c.equalsIgnoreCase(target)) {
				return c;
			}
		}
		return null;
	}
}
