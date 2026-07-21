CREATE TABLE `accounts` (
	`id` varchar(36) NOT NULL,
	`name` text NOT NULL,
	`platform` enum('抖音','小红书','B站','视频号') NOT NULL,
	`accountUrl` text,
	`category` enum('美妆','游戏','剧情','测评','教程','种草','生活','其他') NOT NULL,
	`followerCount` int DEFAULT 0,
	`status` enum('孵化中','成熟','暂停') DEFAULT '孵化中',
	`assignedEditor` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `hot_topics` (
	`id` varchar(36) NOT NULL,
	`platform` enum('抖音','小红书','B站','视频号') NOT NULL,
	`keyword` text NOT NULL,
	`category` varchar(100),
	`heatScore` decimal(10,2) DEFAULT '0',
	`source` varchar(255),
	`aiAnalysis` text,
	`capturedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `hot_topics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `metrics` (
	`id` varchar(36) NOT NULL,
	`scriptId` varchar(36) NOT NULL,
	`views` int DEFAULT 0,
	`likes` int DEFAULT 0,
	`comments` int DEFAULT 0,
	`shares` int DEFAULT 0,
	`newFollowers` int DEFAULT 0,
	`completionRate` decimal(5,2) DEFAULT '0',
	`recordDate` date NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `metrics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` varchar(36) NOT NULL,
	`week` varchar(20) NOT NULL,
	`accountId` varchar(36),
	`content` text NOT NULL,
	`highlights` text,
	`pitfalls` text,
	`nextWeekPlan` text,
	`aiGenerated` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `scripts` (
	`id` varchar(36) NOT NULL,
	`accountId` varchar(36) NOT NULL,
	`title` text NOT NULL,
	`topicTag` enum('剧情','测评','教程','种草','搞笑','知识','其他') NOT NULL,
	`hookType` enum('提问式','悬念式','痛点式','反转式','数据式','其他') NOT NULL,
	`content` text NOT NULL,
	`ending` text,
	`publishDate` date,
	`videoUrl` text,
	`creator` varchar(255),
	`status` enum('草稿','审核','发布','归档') DEFAULT '草稿',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `scripts_id` PRIMARY KEY(`id`)
);
