CREATE TABLE `trending_items` (
	`id` varchar(36) NOT NULL,
	`platform` enum('抖音','微博','快手','B站') NOT NULL,
	`rank` int NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`hotValue` int DEFAULT 0,
	`url` text,
	`imageUrl` text,
	`category` varchar(100),
	`collectedAt` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `trending_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `trending_snapshots` (
	`id` varchar(36) NOT NULL,
	`platform` enum('抖音','微博','快手','B站') NOT NULL,
	`snapshotDate` date NOT NULL,
	`data` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `trending_snapshots_id` PRIMARY KEY(`id`)
);
