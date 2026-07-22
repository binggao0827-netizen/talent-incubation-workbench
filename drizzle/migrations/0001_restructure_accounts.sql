-- Drop dependent tables first (due to foreign key constraints)
DROP TABLE IF EXISTS `account_content_types`;
DROP TABLE IF EXISTS `reviews`;
DROP TABLE IF EXISTS `metrics`;
DROP TABLE IF EXISTS `scripts`;
DROP TABLE IF EXISTS `accounts`;

-- Create creators table (IP layer)
CREATE TABLE `creators` (
  `id` varchar(36) NOT NULL,
  `name` text NOT NULL,
  `description` text,
  `avatar` text,
  `assignedEditor` varchar(255),
  `status` enum('孵化中','成熟','暂停') NOT NULL DEFAULT '孵化中',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create new accounts table (platform accounts)
CREATE TABLE `accounts` (
  `id` varchar(36) NOT NULL,
  `creatorId` varchar(36) NOT NULL,
  `platform` enum('抖音','小红书','B站','视频号') NOT NULL,
  `accountName` text NOT NULL,
  `homepageUrl` text,
  `followerCount` int DEFAULT 0,
  `status` enum('孵化中','成熟','暂停') NOT NULL DEFAULT '孵化中',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `creatorId` (`creatorId`),
  CONSTRAINT `accounts_ibfk_1` FOREIGN KEY (`creatorId`) REFERENCES `creators` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create content_types table
CREATE TABLE `content_types` (
  `id` varchar(36) NOT NULL,
  `name` text NOT NULL,
  `description` text,
  `color` varchar(20),
  `isDefault` boolean DEFAULT false,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create account_content_types junction table
CREATE TABLE `account_content_types` (
  `id` varchar(36) NOT NULL,
  `accountId` varchar(36) NOT NULL,
  `contentTypeId` varchar(36) NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `accountId` (`accountId`),
  KEY `contentTypeId` (`contentTypeId`),
  CONSTRAINT `account_content_types_ibfk_1` FOREIGN KEY (`accountId`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `account_content_types_ibfk_2` FOREIGN KEY (`contentTypeId`) REFERENCES `content_types` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recreate scripts table with new accountId reference
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
  `status` enum('草稿','审核','发布','归档') NOT NULL DEFAULT '草稿',
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `accountId` (`accountId`),
  CONSTRAINT `scripts_ibfk_1` FOREIGN KEY (`accountId`) REFERENCES `accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recreate metrics table
CREATE TABLE `metrics` (
  `id` varchar(36) NOT NULL,
  `scriptId` varchar(36) NOT NULL,
  `views` int DEFAULT 0,
  `likes` int DEFAULT 0,
  `comments` int DEFAULT 0,
  `shares` int DEFAULT 0,
  `newFollowers` int DEFAULT 0,
  `completionRate` decimal(5,2) DEFAULT 0,
  `recordDate` date NOT NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `scriptId` (`scriptId`),
  CONSTRAINT `metrics_ibfk_1` FOREIGN KEY (`scriptId`) REFERENCES `scripts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Recreate reviews table
CREATE TABLE `reviews` (
  `id` varchar(36) NOT NULL,
  `week` varchar(20) NOT NULL,
  `accountId` varchar(36),
  `content` text NOT NULL,
  `highlights` text,
  `pitfalls` text,
  `nextWeekPlan` text,
  `aiGenerated` boolean DEFAULT false,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `accountId` (`accountId`),
  CONSTRAINT `reviews_ibfk_1` FOREIGN KEY (`accountId`) REFERENCES `accounts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default content types for medical beauty vertical
INSERT INTO `content_types` (`id`, `name`, `description`, `color`, `isDefault`) VALUES
('ct-001', '口播', '医生/医美顾问直接对镜头讲解', '#FF6B6B', true),
('ct-002', '剧情', '故事化呈现医美前后对比或就医体验', '#4ECDC4', true),
('ct-003', '教程', '详细的护肤、化妆、术后护理教程', '#45B7D1', true),
('ct-004', '案例展示', '真实案例的前后对比', '#96CEB4', true),
('ct-005', '科普', '医学知识普及，去除消费者疑虑', '#FFEAA7', true),
('ct-006', '体验分享', '消费者真实体验和感受', '#DDA0DD', true),
('ct-007', '问答', '针对常见问题的快速解答', '#87CEEB', true),
('ct-008', '合作推荐', '与其他账号或品牌的合作内容', '#F0E68C', true);
