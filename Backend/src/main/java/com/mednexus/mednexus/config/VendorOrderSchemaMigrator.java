package com.mednexus.mednexus.config;

import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/** Keeps {@code vendor_order.product_id} as a historical reference without blocking product deletion. */
@Component
public class VendorOrderSchemaMigrator {

	private static final Logger log = LoggerFactory.getLogger(VendorOrderSchemaMigrator.class);

	private final JdbcTemplate jdbc;

	@Autowired
	public VendorOrderSchemaMigrator(JdbcTemplate jdbc) {
		this.jdbc = jdbc;
	}

	public void dropProductForeignKeysIfPresent() {
		try {
			List<String> constraintNames = jdbc.queryForList("""
					SELECT kcu.CONSTRAINT_NAME
					FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
					INNER JOIN INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc
					  ON tc.CONSTRAINT_SCHEMA = kcu.CONSTRAINT_SCHEMA
					 AND tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME
					 AND tc.TABLE_NAME = kcu.TABLE_NAME
					WHERE kcu.TABLE_SCHEMA = DATABASE()
					  AND kcu.TABLE_NAME = 'vendor_order'
					  AND kcu.COLUMN_NAME = 'product_id'
					  AND kcu.REFERENCED_TABLE_NAME = 'product'
					  AND tc.CONSTRAINT_TYPE = 'FOREIGN KEY'
					""", String.class);
			for (String constraintName : constraintNames) {
				jdbc.execute("ALTER TABLE `vendor_order` DROP FOREIGN KEY `" + constraintName + "`");
				log.info("Dropped {} on vendor_order.product_id so orders survive product deletion.", constraintName);
			}
		} catch (Exception ex) {
			log.warn("Could not drop vendor_order product FK: {}", ex.getMessage());
		}
	}
}
