import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  decimal,
  date,
  boolean,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * 创作者表（IP 层）
 * 代表一个真实的人或团队，可在多个平台有账号
 */
export const creators = mysqlTable("creators", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  name: text("name").notNull(), // 创作者名称（如「小美医生」）
  description: text("description"), // 创作者描述
  avatar: text("avatar"), // 头像 URL
  assignedEditor: varchar("assignedEditor", { length: 255 }), // 负责编导
  status: mysqlEnum("status", ["孵化中", "成熟", "暂停"]).default("孵化中"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Creator = typeof creators.$inferSelect;
export type InsertCreator = typeof creators.$inferInsert;

/**
 * 平台账号表
 * 代表一个创作者在某个平台的账号
 */
export const accounts = mysqlTable("accounts", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  creatorId: varchar("creatorId", { length: 36 }).notNull(), // 关联创作者
  platform: mysqlEnum("platform", ["抖音", "小红书", "B站", "视频号"]).notNull(),
  accountName: text("accountName").notNull(), // 该平台的账号名
  homepageUrl: text("homepageUrl"), // 该平台的主页链接
  followerCount: int("followerCount").default(0), // 当前粉丝数
  status: mysqlEnum("status", ["孵化中", "成熟", "暂停"]).default("孵化中"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = typeof accounts.$inferInsert;

/**
 * 内容类型表
 * 支持自定义标签，管理员可增删改
 */
export const contentTypes = mysqlTable("content_types", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  name: text("name").notNull(), // 类型名称（如「口播」、「剧情」）
  description: text("description"), // 类型描述
  color: varchar("color", { length: 20 }), // 标签颜色（可选，用于前端展示）
  isDefault: boolean("isDefault").default(false), // 是否为系统默认类型
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ContentType = typeof contentTypes.$inferSelect;
export type InsertContentType = typeof contentTypes.$inferInsert;

/**
 * 账号-内容类型关联表
 * 一个账号可对应多个内容类型
 */
export const accountContentTypes = mysqlTable("account_content_types", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  accountId: varchar("accountId", { length: 36 }).notNull(), // 账号 ID
  contentTypeId: varchar("contentTypeId", { length: 36 }).notNull(), // 内容类型 ID
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AccountContentType = typeof accountContentTypes.$inferSelect;
export type InsertAccountContentType = typeof accountContentTypes.$inferInsert;

/**
 * 脚本表（系统核心）
 * script_id 是全系统的命门，所有数据都通过 script_id 关联
 * 注意：accountId 现在关联的是平台账号，而非创作者
 */
export const scripts = mysqlTable("scripts", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  accountId: varchar("accountId", { length: 36 }).notNull(), // 关联平台账号
  title: text("title").notNull(), // 脚本标题
  topicTag: mysqlEnum("topicTag", [
    "剧情",
    "测评",
    "教程",
    "种草",
    "搞笑",
    "知识",
    "其他",
  ]).notNull(), // 选题标签
  hookType: mysqlEnum("hookType", [
    "提问式",
    "悬念式",
    "痛点式",
    "反转式",
    "数据式",
    "其他",
  ]).notNull(), // 钩子类型
  content: text("content").notNull(), // 脚本正文
  ending: text("ending"), // 脚本结尾
  publishDate: date("publishDate"), // 计划/实际发布日期
  videoUrl: text("videoUrl"), // 成片链接
  creator: varchar("creator", { length: 255 }), // 编导
  status: mysqlEnum("status", ["草稿", "审核", "发布", "归档"]).default("草稿"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Script = typeof scripts.$inferSelect;
export type InsertScript = typeof scripts.$inferInsert;

/**
 * 数据反馈表（与脚本绑定）
 * 命门绑定：script_id 是全系统分析能力的根基
 * 一条脚本可对应多条数据记录（发布第1天、第7天等）
 */
export const metrics = mysqlTable("metrics", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  scriptId: varchar("scriptId", { length: 36 }).notNull(), // 命门绑定
  views: int("views").default(0), // 播放量
  likes: int("likes").default(0), // 点赞
  comments: int("comments").default(0), // 评论
  shares: int("shares").default(0), // 转发
  newFollowers: int("newFollowers").default(0), // 涨粉
  completionRate: decimal("completionRate", { precision: 5, scale: 2 }).default("0"), // 完播率（%）
  recordDate: date("recordDate").notNull(), // 数据录入日期
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Metric = typeof metrics.$inferSelect;
export type InsertMetric = typeof metrics.$inferInsert;

/**
 * 复盘表
 * 按周沉淀工作总结
 * 注意：accountId 现在关联的是平台账号
 */
export const reviews = mysqlTable("reviews", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  week: varchar("week", { length: 20 }).notNull(), // 周次（如 2024-W12）
  accountId: varchar("accountId", { length: 36 }), // 可空，null=整体复盘
  content: text("content").notNull(), // 复盘内容
  highlights: text("highlights"), // 爆款分析
  pitfalls: text("pitfalls"), // 踩坑记录
  nextWeekPlan: text("nextWeekPlan"), // 下周计划
  aiGenerated: boolean("aiGenerated").default(false), // 是否 AI 生成
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

/**
 * 热榜项目表
 * 存储各平台热榜数据
 */
export const trendingItems = mysqlTable("trending_items", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  platform: mysqlEnum("platform", ["抖音", "微博", "快手", "B站"]).notNull(), // 平台
  rank: int("rank").notNull(), // 排名
  title: text("title").notNull(), // 热榜标题
  description: text("description"), // 描述
  hotValue: int("hotValue").default(0), // 热度值
  url: text("url"), // 链接
  imageUrl: text("imageUrl"), // 图片 URL
  category: varchar("category", { length: 100 }), // 分类
  collectedAt: timestamp("collectedAt").defaultNow().notNull(), // 采集时间
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TrendingItem = typeof trendingItems.$inferSelect;
export type InsertTrendingItem = typeof trendingItems.$inferInsert;

/**
 * 热榜快照表
 * 用于保存历史热榜数据，便于分析趋势
 */
export const trendingSnapshots = mysqlTable("trending_snapshots", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  platform: mysqlEnum("platform", ["抖音", "微博", "快手", "B站"]).notNull(), // 平台
  snapshotDate: date("snapshotDate").notNull(), // 快照日期
  data: text("data").notNull(), // JSON 格式的完整热榜数据
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type TrendingSnapshot = typeof trendingSnapshots.$inferSelect;
export type InsertTrendingSnapshot = typeof trendingSnapshots.$inferInsert;

/**
 * 热点表（保留用于向后兼容）
 * 存储各平台热榜数据
 */
export const hotTopics = mysqlTable("hot_topics", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  platform: mysqlEnum("platform", ["抖音", "小红书", "B站", "视频号"]).notNull(),
  keyword: text("keyword").notNull(), // 热点关键词
  category: varchar("category", { length: 100 }), // 领域
  heatScore: decimal("heatScore", { precision: 10, scale: 2 }).default("0"), // 热度分
  source: varchar("source", { length: 255 }), // 来源
  aiAnalysis: text("aiAnalysis"), // AI 对该热点的选题建议
  capturedAt: timestamp("capturedAt").defaultNow().notNull(),
});

export type HotTopic = typeof hotTopics.$inferSelect;
export type InsertHotTopic = typeof hotTopics.$inferInsert;

/**
 * 飞书配置表
 * 存储飞书 API 凭证
 */
export const feishuConfigs = mysqlTable("feishu_configs", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  userId: int("userId").notNull(), // 关联用户
  appId: varchar("appId", { length: 255 }).notNull(), // 飞书应用 ID
  appSecret: text("appSecret").notNull(), // 飞书应用密钥（加密存储）
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type FeishuConfig = typeof feishuConfigs.$inferSelect;
export type InsertFeishuConfig = typeof feishuConfigs.$inferInsert;
