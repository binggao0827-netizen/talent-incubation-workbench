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
 * 达人账号表
 * 存储各平台的达人账号信息
 */
export const accounts = mysqlTable("accounts", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  name: text("name").notNull(), // 达人名/账号名
  platform: mysqlEnum("platform", ["抖音", "小红书", "B站", "视频号"]).notNull(),
  accountUrl: text("accountUrl"), // 主页链接
  category: mysqlEnum("category", [
    "美妆",
    "游戏",
    "剧情",
    "测评",
    "教程",
    "种草",
    "生活",
    "其他",
  ]).notNull(),
  followerCount: int("followerCount").default(0), // 当前粉丝数
  status: mysqlEnum("status", ["孵化中", "成熟", "暂停"]).default("孵化中"),
  assignedEditor: varchar("assignedEditor", { length: 255 }), // 负责编导
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Account = typeof accounts.$inferSelect;
export type InsertAccount = typeof accounts.$inferInsert;

/**
 * 脚本表（系统核心）
 * script_id 是全系统的命门，所有数据都通过 script_id 关联
 */
export const scripts = mysqlTable("scripts", {
  id: varchar("id", { length: 36 }).primaryKey(), // UUID
  accountId: varchar("accountId", { length: 36 }).notNull(), // 关联账号
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
 * 热点表（四期）
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
