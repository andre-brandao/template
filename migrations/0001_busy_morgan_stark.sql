ALTER TABLE `user` ADD `permissions` text DEFAULT '{"isAdmin":false}' NOT NULL;--> statement-breakpoint
ALTER TABLE `bugReport` ADD `page_data` text;--> statement-breakpoint
ALTER TABLE `session` DROP COLUMN `permissions`;