ALTER TABLE `images` ADD COLUMN `metadata_url` text;
ALTER TABLE `images` ADD COLUMN `metadata_key` text;
ALTER TABLE `images` ADD COLUMN `is_approved` integer DEFAULT false;
ALTER TABLE `images` ADD COLUMN `approved_at` integer;

UPDATE `images` SET `is_approved` = false WHERE `is_approved` IS NULL;
