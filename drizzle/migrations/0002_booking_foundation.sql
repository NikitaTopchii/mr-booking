CREATE TABLE `booking_slots` (
	`booking_id` text NOT NULL,
	`room_id` text NOT NULL,
	`slot_starts_at_utc` integer NOT NULL,
	PRIMARY KEY(`booking_id`, `slot_starts_at_utc`),
	FOREIGN KEY (`booking_id`) REFERENCES `bookings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "booking_slots_start_integer" CHECK(typeof("booking_slots"."slot_starts_at_utc") = 'integer')
);
--> statement-breakpoint
CREATE UNIQUE INDEX `booking_slots_room_slot_unique` ON `booking_slots` (`room_id`,`slot_starts_at_utc`);--> statement-breakpoint
CREATE TABLE `bookings` (
	`id` text PRIMARY KEY NOT NULL,
	`room_id` text NOT NULL,
	`author_user_id` text NOT NULL,
	`title` text NOT NULL,
	`starts_at_utc` integer NOT NULL,
	`ends_at_utc` integer NOT NULL,
	`created_at_utc` integer NOT NULL,
	`cancelled_at_utc` integer,
	FOREIGN KEY (`room_id`) REFERENCES `rooms`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`author_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE no action,
	CONSTRAINT "bookings_title_non_empty" CHECK(length(trim("bookings"."title")) > 0),
	CONSTRAINT "bookings_title_max_length" CHECK(length("bookings"."title") <= 100),
	CONSTRAINT "bookings_timestamps_integer" CHECK(typeof("bookings"."starts_at_utc") = 'integer' AND typeof("bookings"."ends_at_utc") = 'integer' AND typeof("bookings"."created_at_utc") = 'integer' AND ("bookings"."cancelled_at_utc" IS NULL OR typeof("bookings"."cancelled_at_utc") = 'integer')),
	CONSTRAINT "bookings_end_after_start" CHECK("bookings"."ends_at_utc" > "bookings"."starts_at_utc"),
	CONSTRAINT "bookings_minimum_duration" CHECK("bookings"."ends_at_utc" - "bookings"."starts_at_utc" >= 1800000),
	CONSTRAINT "bookings_maximum_duration" CHECK("bookings"."ends_at_utc" - "bookings"."starts_at_utc" <= 14400000),
	CONSTRAINT "bookings_slot_duration" CHECK(("bookings"."ends_at_utc" - "bookings"."starts_at_utc") % 1800000 = 0)
);
--> statement-breakpoint
CREATE INDEX `bookings_active_room_start_index` ON `bookings` (`room_id`,`starts_at_utc`) WHERE "bookings"."cancelled_at_utc" IS NULL;--> statement-breakpoint
CREATE INDEX `bookings_active_author_start_index` ON `bookings` (`author_user_id`,`starts_at_utc`) WHERE "bookings"."cancelled_at_utc" IS NULL;