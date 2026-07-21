import { eq, and, like, desc, asc, sql, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, accounts, scripts, metrics, reviews, hotTopics } from "../drizzle/schema";
import { ENV } from './_core/env';
import { nanoid } from 'nanoid';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ========== Accounts Queries ==========

export async function createAccount(data: {
  name: string;
  platform: "抖音" | "小红书" | "B站" | "视频号";
  accountUrl?: string;
  category: "美妆" | "游戏" | "剧情" | "测评" | "教程" | "种草" | "生活" | "其他";
  followerCount?: number;
  status?: "孵化中" | "成熟" | "暂停";
  assignedEditor?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const id = nanoid();
  await db.insert(accounts).values({
    id,
    ...data,
  });
  return id;
}

export async function getAccounts(filters?: {
  platform?: string;
  status?: string;
  search?: string;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (filters?.platform) {
    conditions.push(eq(accounts.platform, filters.platform as any));
  }
  if (filters?.status) {
    conditions.push(eq(accounts.status, filters.status as any));
  }
  if (filters?.search) {
    conditions.push(like(accounts.name, `%${filters.search}%`));
  }

  if (conditions.length > 0) {
    return db.select().from(accounts).where(and(...conditions)).orderBy(desc(accounts.createdAt));
  }

  return db.select().from(accounts).orderBy(desc(accounts.createdAt));
}

export async function getAccountById(id: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(accounts).where(eq(accounts.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateAccount(id: string, data: Partial<typeof accounts.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(accounts).set(data).where(eq(accounts.id, id));
}

export async function deleteAccount(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(accounts).where(eq(accounts.id, id));
}

// ========== Scripts Queries ==========

export async function createScript(data: {
  accountId: string;
  title: string;
  topicTag: "剧情" | "测评" | "教程" | "种草" | "搞笑" | "知识" | "其他";
  hookType: "提问式" | "悬念式" | "痛点式" | "反转式" | "数据式" | "其他";
  content: string;
  ending?: string;
  publishDate?: Date;
  videoUrl?: string;
  creator?: string;
  status?: "草稿" | "审核" | "发布" | "归档";
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const id = nanoid();
  await db.insert(scripts).values({
    id,
    ...data,
  });
  return id;
}

export async function getScripts(filters?: {
  accountId?: string;
  topicTag?: string;
  status?: string;
  search?: string;
  startDate?: Date;
  endDate?: Date;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (filters?.accountId) {
    conditions.push(eq(scripts.accountId, filters.accountId));
  }
  if (filters?.topicTag) {
    conditions.push(eq(scripts.topicTag, filters.topicTag as any));
  }
  if (filters?.status) {
    conditions.push(eq(scripts.status, filters.status as any));
  }
  if (filters?.search) {
    conditions.push(like(scripts.title, `%${filters.search}%`));
  }
  if (filters?.startDate) {
    conditions.push(gte(scripts.publishDate, filters.startDate));
  }
  if (filters?.endDate) {
    conditions.push(lte(scripts.publishDate, filters.endDate));
  }

  if (conditions.length > 0) {
    return db.select().from(scripts).where(and(...conditions)).orderBy(desc(scripts.createdAt));
  }

  return db.select().from(scripts).orderBy(desc(scripts.createdAt));
}

export async function getScriptById(id: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(scripts).where(eq(scripts.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateScript(id: string, data: Partial<typeof scripts.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(scripts).set(data).where(eq(scripts.id, id));
}

export async function deleteScript(id: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.delete(scripts).where(eq(scripts.id, id));
}

// ========== Metrics Queries ==========

export async function createMetric(data: {
  scriptId: string;
  views?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  newFollowers?: number;
  completionRate?: string;
  recordDate: Date;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const id = nanoid();
  await db.insert(metrics).values({
    id,
    ...data,
  });
  return id;
}

export async function getMetricsByScriptId(scriptId: string) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(metrics).where(eq(metrics.scriptId, scriptId)).orderBy(desc(metrics.recordDate));
}

export async function getMetricsForPeriod(startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(metrics).where(
    and(
      gte(metrics.recordDate, startDate),
      lte(metrics.recordDate, endDate)
    )
  ).orderBy(desc(metrics.recordDate));
}

export async function updateMetric(id: string, data: Partial<typeof metrics.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(metrics).set(data).where(eq(metrics.id, id));
}

// ========== Reviews Queries ==========

export async function createReview(data: {
  week: string;
  accountId?: string;
  content: string;
  highlights?: string;
  pitfalls?: string;
  nextWeekPlan?: string;
  aiGenerated?: boolean;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const id = nanoid();
  await db.insert(reviews).values({
    id,
    ...data,
  });
  return id;
}

export async function getReviews(filters?: {
  week?: string;
  accountId?: string;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (filters?.week) {
    conditions.push(eq(reviews.week, filters.week));
  }
  if (filters?.accountId) {
    conditions.push(eq(reviews.accountId, filters.accountId));
  }

  if (conditions.length > 0) {
    return db.select().from(reviews).where(and(...conditions)).orderBy(desc(reviews.week));
  }

  return db.select().from(reviews).orderBy(desc(reviews.week));
}

export async function getReviewById(id: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db.select().from(reviews).where(eq(reviews.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateReview(id: string, data: Partial<typeof reviews.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(reviews).set(data).where(eq(reviews.id, id));
}

// ========== Hot Topics Queries ==========

export async function createHotTopic(data: {
  platform: "抖音" | "小红书" | "B站" | "视频号";
  keyword: string;
  category?: string;
  heatScore?: string;
  source?: string;
  aiAnalysis?: string;
}) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const id = nanoid();
  await db.insert(hotTopics).values({
    id,
    ...data,
  });
  return id;
}

export async function getHotTopics(filters?: {
  platform?: string;
  category?: string;
}) {
  const db = await getDb();
  if (!db) return [];

  const conditions = [];
  if (filters?.platform) {
    conditions.push(eq(hotTopics.platform, filters.platform as any));
  }
  if (filters?.category) {
    conditions.push(eq(hotTopics.category, filters.category));
  }

  if (conditions.length > 0) {
    return db.select().from(hotTopics).where(and(...conditions)).orderBy(desc(hotTopics.heatScore));
  }

  return db.select().from(hotTopics).orderBy(desc(hotTopics.heatScore));
}

// ========== Analytics Queries ==========

export async function getAccountStats(accountId: string, startDate: Date, endDate: Date) {
  const db = await getDb();
  if (!db) return null;

  const account = await getAccountById(accountId);
  if (!account) return null;

  // Get scripts for this account in the period
  const accountScripts = await db.select().from(scripts).where(
    and(
      eq(scripts.accountId, accountId),
      gte(scripts.publishDate, startDate),
      lte(scripts.publishDate, endDate)
    )
  );

  // Get metrics for these scripts
  const scriptIds = accountScripts.map(s => s.id);
  let totalMetrics = {
    views: 0,
    likes: 0,
    comments: 0,
    shares: 0,
    newFollowers: 0,
  };

  if (scriptIds.length > 0) {
    const metricsData = await db.select().from(metrics).where(
      sql`${metrics.scriptId} IN (${scriptIds.join(',')})`
    );

    metricsData.forEach(m => {
      totalMetrics.views += m.views || 0;
      totalMetrics.likes += m.likes || 0;
      totalMetrics.comments += m.comments || 0;
      totalMetrics.shares += m.shares || 0;
      totalMetrics.newFollowers += m.newFollowers || 0;
    });
  }

  return {
    account,
    scriptCount: accountScripts.length,
    metrics: totalMetrics,
  };
}

export async function getTopScriptsByMetric(metric: 'views' | 'likes' | 'newFollowers', limit: number = 5) {
  const db = await getDb();
  if (!db) return [];

  const metricField = metric === 'views' ? metrics.views : 
                      metric === 'likes' ? metrics.likes : 
                      metrics.newFollowers;

  const topMetrics = await db.select().from(metrics)
    .orderBy(desc(metricField))
    .limit(limit);

  const scriptIds = topMetrics.map(m => m.scriptId);
  if (scriptIds.length === 0) return [];

  const scriptData = await db.select().from(scripts).where(
    sql`${scripts.id} IN (${scriptIds.join(',')})`
  );

  return scriptData.map(script => {
    const metric = topMetrics.find(m => m.scriptId === script.id);
    return { script, metric };
  });
}
