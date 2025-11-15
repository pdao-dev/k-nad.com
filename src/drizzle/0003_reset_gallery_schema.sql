DROP TABLE IF EXISTS `images`;
DROP TABLE IF EXISTS `users`;
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`wallet_address` text NOT NULL,
	`username` text,
	`profile_image` text,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_wallet_address_unique` ON `users` (`wallet_address`);
--> statement-breakpoint
CREATE TABLE `images` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`title` text,
	`description` text,
	`image_url` text NOT NULL,
	`thumbnail_url` text,
	`r2_key` text NOT NULL,
	`metadata_url` text,
	`metadata_key` text,
	`token_id` text,
	`contract_address` text,
	`transaction_hash` text,
	`minted_at` integer,
	`is_approved` integer DEFAULT false,
	`approved_at` integer,
	`is_reported` integer DEFAULT false,
	`report_count` integer DEFAULT 0,
	`created_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	`updated_at` integer DEFAULT (cast((julianday('now') - 2440587.5)*86400000 as integer)),
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action
);
