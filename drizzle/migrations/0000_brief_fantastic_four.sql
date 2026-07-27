CREATE TABLE `rooms` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`floor` integer NOT NULL,
	`capacity` integer NOT NULL,
	`created_at_utc` integer NOT NULL,
	CONSTRAINT "rooms_name_non_empty" CHECK(length(trim("rooms"."name")) > 0),
	CONSTRAINT "rooms_floor_integer" CHECK(typeof("rooms"."floor") = 'integer'),
	CONSTRAINT "rooms_capacity_positive" CHECK(typeof("rooms"."capacity") = 'integer' AND "rooms"."capacity" > 0),
	CONSTRAINT "rooms_created_at_utc_integer" CHECK(typeof("rooms"."created_at_utc") = 'integer')
);
--> statement-breakpoint
CREATE UNIQUE INDEX `rooms_name_unique` ON `rooms` (`name`);