CREATE TABLE `email_verification_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`created_at_utc` integer NOT NULL,
	`expires_at_utc` integer NOT NULL,
	`consumed_at_utc` integer,
	`invalidated_at_utc` integer,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "email_verification_tokens_timestamps_integer" CHECK(typeof("email_verification_tokens"."created_at_utc") = 'integer' AND typeof("email_verification_tokens"."expires_at_utc") = 'integer' AND ("email_verification_tokens"."consumed_at_utc" IS NULL OR typeof("email_verification_tokens"."consumed_at_utc") = 'integer') AND ("email_verification_tokens"."invalidated_at_utc" IS NULL OR typeof("email_verification_tokens"."invalidated_at_utc") = 'integer')),
	CONSTRAINT "email_verification_tokens_expiry_after_creation" CHECK("email_verification_tokens"."expires_at_utc" > "email_verification_tokens"."created_at_utc")
);
--> statement-breakpoint
CREATE UNIQUE INDEX `email_verification_tokens_hash_unique` ON `email_verification_tokens` (`token_hash`);--> statement-breakpoint
CREATE INDEX `email_verification_tokens_user_active_index` ON `email_verification_tokens` (`user_id`,`created_at_utc`,`consumed_at_utc`,`invalidated_at_utc`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`normalized_email` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at_utc` integer NOT NULL,
	`email_verified_at_utc` integer,
	CONSTRAINT "users_name_non_empty" CHECK(length(trim("__new_users"."name")) > 0),
	CONSTRAINT "users_created_at_utc_integer" CHECK(typeof("__new_users"."created_at_utc") = 'integer'),
	CONSTRAINT "users_email_verified_at_utc_integer" CHECK("__new_users"."email_verified_at_utc" IS NULL OR typeof("__new_users"."email_verified_at_utc") = 'integer')
);
--> statement-breakpoint
INSERT INTO `__new_users`("id", "name", "email", "normalized_email", "password_hash", "created_at_utc", "email_verified_at_utc") SELECT "id", "name", "email", "normalized_email", "password_hash", "created_at_utc", "created_at_utc" FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `users_normalized_email_unique` ON `users` (`normalized_email`);
