CREATE TABLE `magic_link` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`email` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `password_reset_code` (
	`token_hash` text NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `user_verification_code` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`user_id` text NOT NULL,
	`email` text NOT NULL,
	`expires_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `product_category` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `product_item` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` integer,
	`product_id` integer NOT NULL,
	`name` text NOT NULL,
	`sku` text,
	`quantity` integer DEFAULT 1 NOT NULL,
	`image_id` integer,
	`retail_price` integer NOT NULL,
	`wholesale_price` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `product`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sku`) REFERENCES `sku`(`sku`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`image_id`) REFERENCES `image`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `distribuidora` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `stock` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`updated_at` integer,
	`distribuidora_id` integer NOT NULL,
	`name` text NOT NULL,
	`sku` text,
	`quantity` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`distribuidora_id`) REFERENCES `distribuidora`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`sku`) REFERENCES `sku`(`sku`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `sku` (
	`sku` text PRIMARY KEY NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP),
	`name` text NOT NULL
);
--> statement-breakpoint
DROP TABLE `brand`;--> statement-breakpoint
DROP TABLE `category`;--> statement-breakpoint
DROP TABLE `prices`;--> statement-breakpoint
DROP TABLE `product_entry`;--> statement-breakpoint
DROP TABLE `product_price`;--> statement-breakpoint
/*
 SQLite does not support "Set default to column" out of the box, we do not generate automatic migration for that, so it has to be done manually
 Please refer to: https://www.techonthenet.com/sqlite/tables/alter_table.php
                  https://www.sqlite.org/lang_altertable.html
                  https://stackoverflow.com/questions/2083543/modify-a-columns-type-in-sqlite3

 Due to that we don't generate migration automatically and it has to be done manually
*/--> statement-breakpoint
ALTER TABLE `user` ADD `email` text NOT NULL;--> statement-breakpoint
ALTER TABLE `user` ADD `email_verified` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `product` ADD `category_id` integer REFERENCES product_category(id);--> statement-breakpoint
ALTER TABLE `product` ADD `image_id` integer REFERENCES image(id);--> statement-breakpoint
ALTER TABLE `bugReport` ADD `metadata` text;--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
/*
 SQLite does not support "Creating foreign key on existing column" out of the box, we do not generate automatic migration for that, so it has to be done manually
 Please refer to: https://www.techonthenet.com/sqlite/tables/alter_table.php
                  https://www.sqlite.org/lang_altertable.html

 Due to that we don't generate migration automatically and it has to be done manually
*/--> statement-breakpoint
ALTER TABLE `bugReport` DROP COLUMN `page_data`;