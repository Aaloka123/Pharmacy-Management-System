-- Run this ONCE against your MedNexus database if signup returns 500 with:
--   Field 'fullName' doesn't have a default value
-- Older Hibernate runs created camelCase columns; the app now uses snake_case only.
-- MySQL 8.0.29+ supports DROP COLUMN IF EXISTS.

USE MedNexus;

ALTER TABLE `user` DROP COLUMN IF EXISTS `fullName`;
ALTER TABLE `user` DROP COLUMN IF EXISTS `phoneNumber`;
