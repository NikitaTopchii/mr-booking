CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token_hash` text NOT NULL,
	`created_at_utc` integer NOT NULL,
	`expires_at_utc` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "sessions_timestamps_integer" CHECK(typeof("sessions"."created_at_utc") = 'integer' AND typeof("sessions"."expires_at_utc") = 'integer'),
	CONSTRAINT "sessions_expiry_after_creation" CHECK("sessions"."expires_at_utc" > "sessions"."created_at_utc")
);
--> statement-breakpoint
CREATE UNIQUE INDEX `sessions_token_hash_unique` ON `sessions` (`token_hash`);--> statement-breakpoint
CREATE INDEX `sessions_user_id_index` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `sessions_expires_at_utc_index` ON `sessions` (`expires_at_utc`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`normalized_email` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at_utc` integer NOT NULL,
	CONSTRAINT "users_name_non_empty" CHECK(length(trim("users"."name")) > 0),
	CONSTRAINT "users_created_at_utc_integer" CHECK(typeof("users"."created_at_utc") = 'integer')
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_normalized_email_unique` ON `users` (`normalized_email`);