CREATE TABLE `account_content_types` (
	`id` varchar(36) NOT NULL,
	`accountId` varchar(36) NOT NULL,
	`contentTypeId` varchar(36) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `account_content_types_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `content_types` (
	`id` varchar(36) NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`color` varchar(20),
	`isDefault` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `content_types_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `creators` (
	`id` varchar(36) NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`avatar` text,
	`assignedEditor` varchar(255),
	`status` enum('孵化中','成熟','暂停') DEFAULT '孵化中',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `creators_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `feishu_configs` (
	`id` varchar(36) NOT NULL,
	`userId` int NOT NULL,
	`appId` varchar(255) NOT NULL,
	`appSecret` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `feishu_configs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `accounts` ADD `creatorId` varchar(36) NOT NULL;--> statement-breakpoint
ALTER TABLE `accounts` ADD `accountName` text NOT NULL;--> statement-breakpoint
ALTER TABLE `accounts` ADD `homepageUrl` text;--> statement-breakpoint
ALTER TABLE `accounts` DROP COLUMN `name`;--> statement-breakpoint
ALTER TABLE `accounts` DROP COLUMN `accountUrl`;--> statement-breakpoint
ALTER TABLE `accounts` DROP COLUMN `category`;--> statement-breakpoint
ALTER TABLE `accounts` DROP COLUMN `assignedEditor`;